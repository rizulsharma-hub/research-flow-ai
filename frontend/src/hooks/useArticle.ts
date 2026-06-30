'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type CreateArticleInput } from '@/lib/api';

export function useArticles(page = 1) {
  return useQuery({
    queryKey: ['articles', page],
    queryFn: () => api.articles.list(page),
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['article', id],
    queryFn: () => api.articles.get(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'RUNNING' || status === 'QUEUED' ? 2000 : false;
    },
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleInput) => api.articles.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useRetryArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.articles.retry(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['article', id] });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useRetryFromStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stageName }: { id: string; stageName: string }) =>
      api.articles.retryFromStage(id, stageName),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['article', id] });
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.articles.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.settings.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
