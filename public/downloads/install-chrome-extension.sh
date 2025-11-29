#!/bin/bash

###############################################################################
# Workstation Chrome Extension - One-Click Auto-Installer
# Downloads, builds, and loads the Chrome extension in developer mode
# 
# Usage: curl -fsSL https://raw.githubusercontent.com/creditXcredit/workstation/main/public/downloads/install-chrome-extension.sh | bash
# Or: ./install-chrome-extension.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/creditXcredit/workstation.git"
INSTALL_DIR="$HOME/.workstation-chrome"
EXTENSION_DIR="$INSTALL_DIR/chrome-extension"
BUILD_DIR="$INSTALL_DIR/build/chrome-extension"
LOG_FILE="$INSTALL_DIR/install.log"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

print_banner() {
    clear
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                            ║${NC}"
    echo -e "${CYAN}║     ${GREEN}Workstation Chrome Extension Auto-Installer${CYAN}       ║${NC}"
    echo -e "${CYAN}║                                                            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_os() {
    log_info "Checking operating system..."
    
    case "$(uname -s)" in
        Linux*)     OS="Linux";;
        Darwin*)    OS="Mac";;
        CYGWIN*|MINGW*|MSYS*) OS="Windows";;
        *)          OS="Unknown";;
    esac
    
    log_success "Detected OS: $OS"
    
    if [ "$OS" = "Unknown" ]; then
        log_error "Unsupported operating system"
        exit 1
    fi
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ required. Current: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) found"
    
    # Check for Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed. Please install Git first"
        exit 1
    fi
    log_success "Git $(git --version | awk '{print $3}') found"
    
    # Check for Chrome/Chromium
    CHROME_PATH=""
    if command -v google-chrome &> /dev/null; then
        CHROME_PATH="google-chrome"
    elif command -v chromium-browser &> /dev/null; then
        CHROME_PATH="chromium-browser"
    elif command -v chromium &> /dev/null; then
        CHROME_PATH="chromium"
    elif [ "$OS" = "Mac" ] && [ -d "/Applications/Google Chrome.app" ]; then
        CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    elif [ "$OS" = "Windows" ]; then
        CHROME_PATH="chrome.exe"
    fi
    
    if [ -z "$CHROME_PATH" ]; then
        log_warning "Chrome/Chromium not found in PATH. You'll need to manually open chrome://extensions/"
    else
        log_success "Chrome found at: $CHROME_PATH"
    fi
}

create_install_directory() {
    log_info "Creating installation directory..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$INSTALL_DIR/build"
    
    log_success "Installation directory: $INSTALL_DIR"
}

clone_repository() {
    log_info "Downloading Workstation repository..."
    
    if [ -d "$INSTALL_DIR/.git" ]; then
        log_info "Repository already exists, updating..."
        cd "$INSTALL_DIR"
        git pull origin main 2>&1 | tee -a "$LOG_FILE"
    else
        log_info "Cloning repository..."
        git clone "$REPO_URL" "$INSTALL_DIR" 2>&1 | tee -a "$LOG_FILE"
    fi
    
    cd "$INSTALL_DIR"
    log_success "Repository ready"
}

install_dependencies() {
    log_info "Installing dependencies (this may take a few minutes)..."
    
    cd "$INSTALL_DIR"
    npm install --silent 2>&1 | tee -a "$LOG_FILE"
    
    log_success "Dependencies installed"
}

build_extension() {
    log_info "Building Chrome extension..."
    
    cd "$INSTALL_DIR"
    
    # Clean previous build
    rm -rf "$BUILD_DIR"
    
    # Build extension
    npm run build:chrome 2>&1 | tee -a "$LOG_FILE"
    
    if [ -d "$BUILD_DIR" ]; then
        log_success "Extension built successfully"
    else
        log_error "Extension build failed"
        exit 1
    fi
}

start_backend() {
    log_info "Starting backend server..."
    
    cd "$INSTALL_DIR"
    
    # Check if backend is already running
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Backend already running on port 3000"
    else
        # Build backend if not already built
        if [ ! -d "$INSTALL_DIR/dist" ]; then
            log_info "Building backend..."
            npm run build 2>&1 | tee -a "$LOG_FILE"
        fi
        
        # Start backend in background
        log_info "Starting backend server in background..."
        nohup npm start > "$INSTALL_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$INSTALL_DIR/backend.pid"
        
        # Wait for server to start
        log_info "Waiting for backend to start..."
        sleep 3
        
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_success "Backend started (PID: $BACKEND_PID)"
        else
            log_error "Backend failed to start. Check $INSTALL_DIR/backend.log"
            exit 1
        fi
    fi
}

open_chrome_extensions() {
    log_info "Opening Chrome extensions page..."
    
    if [ -n "$CHROME_PATH" ]; then
        if [ "$OS" = "Mac" ]; then
            open -a "Google Chrome" "chrome://extensions/"
        elif [ "$OS" = "Linux" ]; then
            "$CHROME_PATH" "chrome://extensions/" &
        elif [ "$OS" = "Windows" ]; then
            start chrome "chrome://extensions/"
        fi
        log_success "Chrome extensions page opened"
    else
        log_warning "Please manually open: chrome://extensions/"
    fi
}

print_installation_instructions() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              ${GREEN}Installation Complete!${CYAN}                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📋 Final Steps - Load Extension in Chrome:${NC}"
    echo ""
    echo "1. In Chrome, go to: ${CYAN}chrome://extensions/${NC}"
    echo "2. Enable ${GREEN}'Developer mode'${NC} (toggle in top-right corner)"
    echo "3. Click ${GREEN}'Load unpacked'${NC} button"
    echo "4. Navigate to and select: ${CYAN}$BUILD_DIR${NC}"
    echo "5. Click ${GREEN}'Select'${NC}"
    echo ""
    echo -e "${GREEN}✨ Done! The Workstation extension will appear in your toolbar.${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Quick Start:${NC}"
    echo "• Click the extension icon in Chrome"
    echo "• Go to 'Execute' tab"
    echo "• Enter a workflow (e.g., 'Navigate to https://example.com')"
    echo "• Click 'Execute Workflow'"
    echo ""
    echo -e "${YELLOW}🔧 Backend Server:${NC}"
    echo "• Status: ${GREEN}Running${NC}"
    echo "• URL: http://localhost:3000"
    echo "• Stop: kill \$(cat $INSTALL_DIR/backend.pid)"
    echo ""
    echo -e "${YELLOW}📂 Files:${NC}"
    echo "• Extension: $BUILD_DIR"
    echo "• Logs: $LOG_FILE"
    echo "• Backend logs: $INSTALL_DIR/backend.log"
    echo ""
    echo -e "${YELLOW}📖 Documentation:${NC}"
    echo "• Extension docs: $INSTALL_DIR/chrome-extension/README.md"
    echo "• How to use: $INSTALL_DIR/HOW_TO_USE.md"
    echo ""
}

create_quick_access_script() {
    log_info "Creating quick access scripts..."
    
    # Create reload script
    cat > "$INSTALL_DIR/reload-extension.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
npm run build:chrome
echo "Extension rebuilt. Reload it in Chrome at chrome://extensions/"
EOF
    chmod +x "$INSTALL_DIR/reload-extension.sh"
    
    # Create stop backend script
    cat > "$INSTALL_DIR/stop-backend.sh" << 'EOF'
#!/bin/bash
if [ -f "$(dirname "$0")/backend.pid" ]; then
    PID=$(cat "$(dirname "$0")/backend.pid")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Backend stopped (PID: $PID)"
    else
        echo "Backend not running"
    fi
    rm "$(dirname "$0")/backend.pid"
else
    echo "Backend PID file not found"
fi
EOF
    chmod +x "$INSTALL_DIR/stop-backend.sh"
    
    # Create start backend script
    cat > "$INSTALL_DIR/start-backend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Backend already running on port 3000"
else
    nohup npm start > backend.log 2>&1 &
    echo $! > backend.pid
    echo "Backend started (PID: $(cat backend.pid))"
    echo "Logs: backend.log"
fi
EOF
    chmod +x "$INSTALL_DIR/start-backend.sh"
    
    log_success "Quick access scripts created"
}

cleanup_on_error() {
    log_error "Installation failed. Check $LOG_FILE for details"
    exit 1
}

main() {
    # Set up error trap
    trap cleanup_on_error ERR
    
    print_banner
    
    log_info "Starting automated installation..."
    log_info "Timestamp: $(date)"
    echo ""
    
    # Run installation steps
    check_os
    check_prerequisites
    echo ""
    
    create_install_directory
    clone_repository
    install_dependencies
    build_extension
    start_backend
    create_quick_access_script
    echo ""
    
    open_chrome_extensions
    
    # Print final instructions
    print_installation_instructions
    
    log_success "Installation completed successfully!"
    echo ""
}

# Run main function
main "$@"
