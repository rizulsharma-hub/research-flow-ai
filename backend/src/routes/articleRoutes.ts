import { Router } from 'express';
import {
  createArticle,
  listArticles,
  getArticle,
  streamArticleEvents,
  retryArticle,
  retryFromStage,
  deleteArticle,
} from '../controllers/articleController.js';

const router = Router();

router.post('/', createArticle);
router.get('/', listArticles);
router.get('/:id', getArticle);
router.get('/:id/events', streamArticleEvents);
router.post('/:id/retry', retryArticle);
router.post('/:id/retry-stage', retryFromStage);
router.delete('/:id', deleteArticle);

export default router;
