/**
 * Workflow API Routes
 * 
 * REST API endpoints for workflow management including templates,
 * execution, and real-time monitoring.
 * 
 * @module automation/workflow/api-routes
 * @version 2.0.0
 */

import { Router, Request, Response } from 'express';
import { workflowService } from './service.js';
import { logger } from '../../shared/utils/logger.js';
import { withRetry } from '../../shared/utils/retry.js';

const router = Router();

/**
 * GET /api/workflows/templates
 * Fetch all workflow templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    // In production, load from template-loader
    const templates = [
      {
        id: 'template_1',
        name: 'Web Scraping Template',
        description: 'Extract data from websites',
        category: 'data-extraction',
        steps: [],
        metadata: { difficulty: 'beginner' },
      },
      // Additional templates would be loaded here
    ];

    logger.info('Fetched workflow templates', { count: templates.length });
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch templates', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/templates/:templateId
 * Fetch specific workflow template
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;

    // Load template (would use template-loader in production)
    const template = {
      id: templateId,
      name: 'Sample Template',
      description: 'Sample workflow template',
      category: 'general',
      steps: [],
    };

    res.json({
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to fetch template', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/workflows/templates/:templateId/create
 * Create workflow from template
 */
router.post('/templates/:templateId/create', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const { name, variables } = req.body;

    // Create workflow from template
    const workflow = await workflowService.createWorkflow({
      name: name || `Workflow from ${templateId}`,
      description: `Created from template ${templateId}`,
      definition: {
        steps: [],
        triggers: [],
        variables: variables || {},
      },
      owner_id: 'system',
      workspace_id: 'default',
    });

    logger.info('Workflow created from template', {
      templateId,
      workflowId: workflow.id,
    });

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to create workflow from template', {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/workflows/:workflowId/execute
 * Execute workflow
 */
router.post('/:workflowId/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const { variables } = req.body;

    const workflow = await workflowService.getWorkflow(workflowId);
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Initialize execution context
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    await workflowService.initializeOrchestrationContext(
      workflowId,
      executionId,
      variables
    );

    logger.info('Workflow execution started', { workflowId, executionId });

    res.json({
      success: true,
      data: {
        executionId,
        workflowId,
        status: 'running',
        progress: 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to execute workflow', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/executions/:executionId
 * Get execution status
 */
router.get('/executions/:executionId', async (req: Request, res: Response) => {
  try {
    const { executionId } = req.params;

    // Get execution metrics
    const metrics = await workflowService.getOrchestrationMetrics(executionId);

    res.json({
      success: true,
      data: {
        executionId,
        status: 'running',
        progress: Math.min((metrics.checkpoints / 10) * 100, 100),
        currentStep: `Step ${metrics.checkpoints}`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get execution status', {
      error: (error as Error).message,
    });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows
 * List all workflows
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { owner_id } = req.query;
    const workflows = await workflowService.listWorkflows(owner_id as string);

    res.json({
      success: true,
      data: workflows,
      count: workflows.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to list workflows', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/workflows/:workflowId
 * Get specific workflow
 */
router.get('/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const workflow = await workflowService.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to get workflow', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * PUT /api/workflows/:workflowId
 * Update workflow
 */
router.put('/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const updates = req.body;

    const workflow = await workflowService.updateWorkflow(workflowId, updates);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: workflow,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to update workflow', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * DELETE /api/workflows/:workflowId
 * Delete workflow
 */
router.delete('/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const deleted = await workflowService.deleteWorkflow(workflowId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Failed to delete workflow', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: (error as Error).message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
