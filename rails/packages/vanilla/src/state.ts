/**
 * Toast state management - Observer pattern
 * Vanilla JS port of sonner's state.ts
 */

import type {
  CustomContent,
  ExternalToast,
  PromiseData,
  PromiseT,
  ToastT,
  ToastToDismiss,
  ToastTypes,
} from './types';

let toastsCounter = 1;

type Subscriber = (toast: ToastT | ToastToDismiss) => void;

class Observer {
  subscribers: Subscriber[] = [];
  toasts: ToastT[] = [];
  dismissedToasts: Set<string | number> = new Set();

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.push(subscriber);
    return () => {
      const index = this.subscribers.indexOf(subscriber);
      this.subscribers.splice(index, 1);
    };
  }

  publish(data: ToastT | ToastToDismiss): void {
    this.subscribers.forEach((subscriber) => subscriber(data));
  }

  addToast(data: ToastT): void {
    this.publish(data);
    this.toasts = [...this.toasts, data];
  }

  create(
    data: ExternalToast & {
      message?: string;
      type?: ToastTypes;
      promise?: PromiseT;
    }
  ): number | string {
    const { message, ...rest } = data;
    const id =
      typeof data?.id === 'number' || (data.id && String(data.id).length > 0)
        ? data.id!
        : toastsCounter++;
    const alreadyExists = this.toasts.find((toast) => toast.id === id);
    const dismissible = data.dismissible === undefined ? true : data.dismissible;

    if (this.dismissedToasts.has(id)) {
      this.dismissedToasts.delete(id);
    }

    if (alreadyExists) {
      this.toasts = this.toasts.map((toast) => {
        if (toast.id === id) {
          this.publish({ ...toast, ...data, id, title: message } as ToastT);
          return {
            ...toast,
            ...data,
            id,
            dismissible,
            title: message,
          };
        }
        return toast;
      });
    } else {
      this.addToast({ title: message, ...rest, dismissible, id } as ToastT);
    }

    return id;
  }

  dismiss(id?: number | string): number | string | undefined {
    if (id) {
      this.dismissedToasts.add(id);
      requestAnimationFrame(() =>
        this.subscribers.forEach((subscriber) => subscriber({ id, dismiss: true }))
      );
    } else {
      this.toasts.forEach((toast) => {
        this.subscribers.forEach((subscriber) => subscriber({ id: toast.id, dismiss: true }));
      });
    }
    return id;
  }

  message(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, message });
  }

  error(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, message, type: 'error' });
  }

  success(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, type: 'success', message });
  }

  info(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, type: 'info', message });
  }

  warning(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, type: 'warning', message });
  }

  loading(message: string, data?: ExternalToast): number | string {
    return this.create({ ...data, type: 'loading', message });
  }

  promise<ToastData>(
    promise: PromiseT<ToastData>,
    data?: PromiseData<ToastData>
  ): { unwrap: () => Promise<ToastData> } | (number & { unwrap: () => Promise<ToastData> }) | (string & { unwrap: () => Promise<ToastData> }) | undefined {
    if (!data) return undefined;

    let id: string | number | undefined = undefined;
    if (data.loading !== undefined) {
      id = this.create({
        ...data,
        promise,
        type: 'loading',
        message: data.loading,
        description: typeof data.description !== 'function' ? data.description : undefined,
      });
    }

    const p = Promise.resolve(typeof promise === 'function' ? promise() : promise);

    let shouldDismiss = id !== undefined;
    let result: ['resolve', ToastData] | ['reject', unknown];

    const originalPromise = p
      .then(async (response) => {
        result = ['resolve', response];

        // Check for HTTP error response
        if (isHttpResponse(response) && !response.ok) {
          shouldDismiss = false;
          const promiseData =
            typeof data.error === 'function'
              ? await data.error(`HTTP error! status: ${response.status}`)
              : data.error;
          const description =
            typeof data.description === 'function'
              ? await data.description(`HTTP error! status: ${response.status}`)
              : data.description;
          this.create({ id, type: 'error', description, message: promiseData });
        } else if (response instanceof Error) {
          shouldDismiss = false;
          const promiseData =
            typeof data.error === 'function' ? await data.error(response) : data.error;
          const description =
            typeof data.description === 'function'
              ? await data.description(response)
              : data.description;
          this.create({ id, type: 'error', description, message: promiseData });
        } else if (data.success !== undefined) {
          shouldDismiss = false;
          const promiseData =
            typeof data.success === 'function' ? await data.success(response) : data.success;
          const description =
            typeof data.description === 'function'
              ? await data.description(response)
              : data.description;
          this.create({ id, type: 'success', description, message: promiseData });
        }
      })
      .catch(async (error: unknown) => {
        result = ['reject', error];
        if (data.error !== undefined) {
          shouldDismiss = false;
          const promiseData =
            typeof data.error === 'function' ? await data.error(error) : data.error;
          const description =
            typeof data.description === 'function'
              ? await data.description(error)
              : data.description;
          this.create({ id, type: 'error', description, message: promiseData });
        }
      })
      .finally(() => {
        if (shouldDismiss) {
          this.dismiss(id);
          id = undefined;
        }
        data.finally?.();
      });

    const unwrap = () =>
      new Promise<ToastData>((resolve, reject) =>
        originalPromise
          .then(() => (result[0] === 'reject' ? reject(result[1]) : resolve(result[1])))
          .catch(reject)
      );

    if (typeof id !== 'string' && typeof id !== 'number') {
      return { unwrap };
    } else {
      return Object.assign(id, { unwrap }) as (number | string) & { unwrap: () => Promise<ToastData> };
    }
  }

  custom(content: CustomContent, data?: ExternalToast): number | string {
    const id = data?.id ?? toastsCounter++;
    this.addToast({
      ...data,
      id,
      custom: content,
    } as ToastT);
    return id;
  }

  getActiveToasts(): ToastT[] {
    return this.toasts.filter((toast) => !this.dismissedToasts.has(toast.id));
  }
}

function isHttpResponse(data: unknown): data is Response {
  return (
    data !== null &&
    typeof data === 'object' &&
    'ok' in data &&
    typeof (data as Response).ok === 'boolean' &&
    'status' in data &&
    typeof (data as Response).status === 'number'
  );
}

export const ToastState = new Observer();

// Main toast function
const toastFunction = (message: string, data?: ExternalToast): number | string => {
  const id = data?.id ?? toastsCounter++;
  ToastState.addToast({
    title: message,
    ...data,
    id,
  } as ToastT);
  return id;
};

const getHistory = () => ToastState.toasts;
const getToasts = () => ToastState.getActiveToasts();

// Export toast API with all methods
export const toast = Object.assign(
  toastFunction,
  {
    success: ToastState.success.bind(ToastState),
    info: ToastState.info.bind(ToastState),
    warning: ToastState.warning.bind(ToastState),
    error: ToastState.error.bind(ToastState),
    message: ToastState.message.bind(ToastState),
    promise: ToastState.promise.bind(ToastState),
    dismiss: ToastState.dismiss.bind(ToastState),
    loading: ToastState.loading.bind(ToastState),
    custom: ToastState.custom.bind(ToastState),
  },
  { getHistory, getToasts }
);
