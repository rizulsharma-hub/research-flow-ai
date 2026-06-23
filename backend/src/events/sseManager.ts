import { EventEmitter } from 'events';
import { Response } from 'express';
import type { PipelineEvent } from '../types/index.js';

class SSEManager extends EventEmitter {
  private clients: Map<string, Set<Response>> = new Map();

  addClient(articleId: string, res: Response): void {
    if (!this.clients.has(articleId)) {
      this.clients.set(articleId, new Set());
    }
    this.clients.get(articleId)!.add(res);

    res.on('close', () => {
      this.removeClient(articleId, res);
    });
  }

  removeClient(articleId: string, res: Response): void {
    const clients = this.clients.get(articleId);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        this.clients.delete(articleId);
      }
    }
  }

  sendEvent(articleId: string, event: PipelineEvent): void {
    const clients = this.clients.get(articleId);
    if (!clients || clients.size === 0) return;

    const data = `data: ${JSON.stringify(event)}\n\n`;

    clients.forEach((res) => {
      try {
        res.write(data);
      } catch {
        this.removeClient(articleId, res);
      }
    });

    this.emit('event', { articleId, event });
  }

  broadcastProgress(
    articleId: string,
    jobId: string,
    stage: PipelineEvent['stage'],
    message: string,
    data?: unknown
  ): void {
    this.sendEvent(articleId, {
      jobId,
      articleId,
      stage,
      event: 'STAGE_PROGRESS',
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  getClientCount(articleId: string): number {
    return this.clients.get(articleId)?.size ?? 0;
  }
}

export const sseManager = new SSEManager();
