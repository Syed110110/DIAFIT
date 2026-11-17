export const auditActionForMethod = (method: string): 'READ' | 'WRITE' | null => {
  if (method === 'GET' || method === 'HEAD') return 'READ';
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return 'WRITE';
  return null;
};

export const isApiRequest = (path: string): boolean => path.startsWith('/api/');