#!/bin/bash
#
# Docker Rollback Script for Workstation
# 
# This script provides automated rollback capabilities for Docker deployments
# with health check verification and multi-stage rollback support.
#
# Usage:
#   ./rollback-docker.sh [options]
#
# Options:
#   --service <name>      Service name to rollback (default: workstation)
#   --version <version>   Specific version to rollback to (optional)
#   --previous           Rollback to previous version (default if no version specified)
#   --list-versions      List available versions for rollback
#   --dry-run            Show what would be done without executing
#   --health-check       Verify health before and after rollback
#   --no-backup          Skip creating backup of current state
#
# Examples:
#   ./rollback-docker.sh --service workstation --previous
#   ./rollback-docker.sh --service workstation --version v1.2.3
#   ./rollback-docker.sh --list-versions
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/rollback-$(date +%Y%m%d-%H%M%S).log"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io/creditxcredit}"
SERVICE_NAME="${SERVICE_NAME:-workstation}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3000/health}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-30}"
MAX_ROLLBACK_HISTORY="${MAX_ROLLBACK_HISTORY:-10}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $*" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $*" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log_error "$1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v docker >/dev/null 2>&1 || error_exit "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || log_warning "docker-compose not found, using docker compose"
    command -v jq >/dev/null 2>&1 || error_exit "jq is not installed (required for JSON parsing)"
    command -v curl >/dev/null 2>&1 || error_exit "curl is not installed (required for health checks)"
    
    log_success "Prerequisites check passed"
}

# Get current running version
get_current_version() {
    local service=$1
    
    # Try to get version from running container labels
    local container_id
    container_id=$(docker ps -q -f "name=${service}" | head -n 1)
    
    if [ -z "$container_id" ]; then
        log_warning "No running container found for service: ${service}"
        return 1
    fi
    
    local version
    version=$(docker inspect "$container_id" --format '{{index .Config.Labels "workstation.version"}}' 2>/dev/null || echo "unknown")
    
    if [ "$version" = "unknown" ] || [ -z "$version" ]; then
        # Fallback to image tag
        version=$(docker inspect "$container_id" --format '{{.Config.Image}}' | cut -d: -f2)
    fi
    
    echo "$version"
}

# Get available versions from registry and local images
list_available_versions() {
    local service=$1
    
    log "Fetching available versions for ${service}..."
    
    echo -e "\n${BLUE}=== Available Versions ===${NC}"
    echo -e "${BLUE}From Local Images:${NC}"
    
    # List local images
    docker images "${DOCKER_REGISTRY}/${service}" --format "table {{.Tag}}\t{{.ID}}\t{{.CreatedAt}}" | head -n $((MAX_ROLLBACK_HISTORY + 1))
    
    echo -e "\n${BLUE}Current Running Version:${NC}"
    local current_version
    current_version=$(get_current_version "$service")
    echo "  ${GREEN}${current_version}${NC}"
    
    echo -e "\n${BLUE}Container Details:${NC}"
    docker ps -f "name=${service}" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
}

# Get previous version
get_previous_version() {
    local service=$1
    local current_version
    current_version=$(get_current_version "$service")
    
    # Get list of versions, excluding current
    local previous_version
    previous_version=$(docker images "${DOCKER_REGISTRY}/${service}" --format "{{.Tag}}" | grep -v "^${current_version}$" | grep -v "latest" | head -n 1)
    
    if [ -z "$previous_version" ]; then
        error_exit "No previous version found for rollback"
    fi
    
    echo "$previous_version"
}

# Health check function
perform_health_check() {
    local url=$1
    local timeout=$2
    local max_attempts=10
    local attempt=1
    
    log "Performing health check (timeout: ${timeout}s)..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s -m "$timeout" "$url" >/dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 3s..."
        sleep 3
        ((attempt++))
    done
    
    log_error "Health check failed after $max_attempts attempts"
    return 1
}

# Create backup of current state
create_backup() {
    local service=$1
    local backup_dir="${SCRIPT_DIR}/backups"
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    
    log "Creating backup of current state..."
    
    mkdir -p "$backup_dir"
    
    # Backup current container state
    local container_id
    container_id=$(docker ps -q -f "name=${service}" | head -n 1)
    
    if [ -n "$container_id" ]; then
        docker inspect "$container_id" > "${backup_dir}/${service}-${timestamp}.json"
        log_success "Backup created: ${backup_dir}/${service}-${timestamp}.json"
    else
        log_warning "No running container to backup"
    fi
    
    # Keep only last 10 backups
    find "$backup_dir" -name "${service}-*.json" -type f | sort -r | tail -n +11 | xargs -r rm
}

# Perform rollback
perform_rollback() {
    local service=$1
    local target_version=$2
    local dry_run=$3
    local skip_backup=$4
    local health_check=$5
    
    log "Starting rollback process..."
    log "Service: ${service}"
    log "Target version: ${target_version}"
    
    if [ "$dry_run" = "true" ]; then
        log_warning "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Get current version
    local current_version
    current_version=$(get_current_version "$service")
    log "Current version: ${current_version}"
    
    # Verify target version exists
    if ! docker images "${DOCKER_REGISTRY}/${service}:${target_version}" --format "{{.ID}}" | grep -q .; then
        error_exit "Target version ${target_version} not found locally. Pull it first with: docker pull ${DOCKER_REGISTRY}/${service}:${target_version}"
    fi
    
    # Health check before rollback
    if [ "$health_check" = "true" ]; then
        log "Pre-rollback health check..."
        if ! perform_health_check "$HEALTH_CHECK_URL" "$HEALTH_CHECK_TIMEOUT"; then
            log_warning "Service is not healthy before rollback. Proceeding anyway..."
        fi
    fi
    
    # Create backup
    if [ "$skip_backup" = "false" ] && [ "$dry_run" = "false" ]; then
        create_backup "$service"
    fi
    
    # Perform rollback
    if [ "$dry_run" = "false" ]; then
        log "Stopping current service..."
        docker-compose -f "$COMPOSE_FILE" stop "$service" || docker compose -f "$COMPOSE_FILE" stop "$service"
        
        log "Removing current container..."
        docker-compose -f "$COMPOSE_FILE" rm -f "$service" || docker compose -f "$COMPOSE_FILE" rm -f "$service"
        
        log "Starting service with version ${target_version}..."
        export DOCKER_IMAGE_TAG="$target_version"
        docker-compose -f "$COMPOSE_FILE" up -d "$service" || docker compose -f "$COMPOSE_FILE" up -d "$service"
        
        log "Waiting for service to start..."
        sleep 5
        
        # Health check after rollback
        if [ "$health_check" = "true" ]; then
            log "Post-rollback health check..."
            if perform_health_check "$HEALTH_CHECK_URL" "$HEALTH_CHECK_TIMEOUT"; then
                log_success "Rollback completed successfully"
                log_success "Service rolled back from ${current_version} to ${target_version}"
            else
                log_error "Service failed health check after rollback"
                log_error "Attempting automatic recovery to ${current_version}..."
                
                # Attempt to roll back to original version
                export DOCKER_IMAGE_TAG="$current_version"
                docker-compose -f "$COMPOSE_FILE" up -d "$service" || docker compose -f "$COMPOSE_FILE" up -d "$service"
                
                error_exit "Rollback failed and recovery attempted. Please verify service status manually."
            fi
        else
            log_success "Rollback completed (health check skipped)"
        fi
    else
        log_warning "DRY RUN: Would stop ${service}"
        log_warning "DRY RUN: Would remove current container"
        log_warning "DRY RUN: Would start ${service} with image ${DOCKER_REGISTRY}/${service}:${target_version}"
    fi
}

# Main function
main() {
    local service="$SERVICE_NAME"
    local target_version=""
    local use_previous=false
    local list_versions=false
    local dry_run=false
    local skip_backup=false
    local health_check=true
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service)
                service="$2"
                shift 2
                ;;
            --version)
                target_version="$2"
                shift 2
                ;;
            --previous)
                use_previous=true
                shift
                ;;
            --list-versions)
                list_versions=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            --no-backup)
                skip_backup=true
                shift
                ;;
            --health-check)
                health_check=true
                shift
                ;;
            --no-health-check)
                health_check=false
                shift
                ;;
            --help)
                grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //'
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1. Use --help for usage information."
                ;;
        esac
    done
    
    log "Docker Rollback Script"
    log "Log file: ${LOG_FILE}"
    echo ""
    
    check_prerequisites
    
    # List versions and exit if requested
    if [ "$list_versions" = "true" ]; then
        list_available_versions "$service"
        exit 0
    fi
    
    # Determine target version
    if [ -z "$target_version" ] && [ "$use_previous" = "true" ]; then
        target_version=$(get_previous_version "$service")
        log "Using previous version: ${target_version}"
    elif [ -z "$target_version" ]; then
        # Default to previous if no version specified
        target_version=$(get_previous_version "$service")
        log "No version specified, using previous: ${target_version}"
    fi
    
    # Confirm rollback unless in dry-run mode
    if [ "$dry_run" = "false" ]; then
        echo -e "${YELLOW}WARNING: This will rollback ${service} to version ${target_version}${NC}"
        read -p "Continue? (yes/no): " -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log "Rollback cancelled by user"
            exit 0
        fi
    fi
    
    # Perform rollback
    perform_rollback "$service" "$target_version" "$dry_run" "$skip_backup" "$health_check"
    
    log_success "Script completed successfully"
}

# Run main function
main "$@"
