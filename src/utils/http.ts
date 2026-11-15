export interface SafeJsonResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  errorMessage?: string;
}

export async function readJsonSafe<T = Record<string, unknown>>(
  res: Response
): Promise<SafeJsonResult<T>> {
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  const text = await res.text();
  const trimmed = text.trim();

  if (!trimmed) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      errorMessage: res.ok ? undefined : `服务响应为空（HTTP ${res.status}）`,
    };
  }

  if (trimmed.startsWith('<') || contentType.includes('text/html')) {
    return {
      ok: false,
      status: res.status,
      data: null,
      errorMessage: '接口返回了网页内容而非数据，请刷新页面或确认后端服务正常运行',
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      errorMessage: `响应格式异常（HTTP ${res.status}）`,
    };
  }
}
