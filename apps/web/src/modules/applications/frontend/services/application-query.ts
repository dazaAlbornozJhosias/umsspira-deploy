import type { BoardPeriod, BoardStatus } from './applications-board.service';

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 15;

const STATUS_VALUES: readonly BoardStatus[] = ['PENDIENTE', 'OBSERVADA', 'APROBADA', 'RECHAZADA'];
export interface ApplicationsUrlState {
  page: number;
  pageSize: number;
  search: string;
  career: string;
  status: '' | BoardStatus;
  period: '' | BoardPeriod;
  year?: number;
  from: string;
  to: string;
}

export const EMPTY_URL_STATE: ApplicationsUrlState = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: '',
  career: '',
  status: '',
  period: '',
  from: '',
  to: '',
};

type ParamsReader = { get(name: string): string | null };
const PERIOD_VALUES: readonly BoardPeriod[] = [
  'last15',
  'last30',
  'semester1',
  'semester2',
  'custom',
];

function toPositiveInt(value: string | null, fallback: number): number {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
}

export function parseApplicationsUrl(params: ParamsReader): ApplicationsUrlState {
  const size = toPositiveInt(params.get('size'), DEFAULT_PAGE_SIZE);
  const status = params.get('status') ?? '';
  const rawPeriod = params.get('period');
  const period = (PERIOD_VALUES as readonly string[]).includes(rawPeriod ?? '')
    ? (rawPeriod as BoardPeriod)
    : '';
  const rawYear = Number(params.get('year'));
  const year =
    (period === 'semester1' || period === 'semester2') &&
    Number.isInteger(rawYear) &&
    rawYear >= 2000 &&
    rawYear <= 2100
      ? rawYear
      : undefined;
  const from = isDateOnly(params.get('from')) ? params.get('from')! : '';
  const to = isDateOnly(params.get('to')) ? params.get('to')! : '';
  const hasCustomRange = period === 'custom' && (from !== '' || to !== '') && (!from || !to || from <= to);

  return {
    page: toPositiveInt(params.get('page'), 1),
    pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(size) ? size : DEFAULT_PAGE_SIZE,
    search: (params.get('q') ?? '').trim(),
    career: params.get('career') ?? '',
    status: (STATUS_VALUES as readonly string[]).includes(status) ? (status as BoardStatus) : '',
    period: period === 'custom' && !hasCustomRange ? '' : period,
    year,
    from: hasCustomRange ? from : '',
    to: hasCustomRange ? to : '',
  };
}

function isDateOnly(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toApplicationsParams(state: ApplicationsUrlState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('size', String(state.pageSize));
  if (state.search) params.set('q', state.search);
  if (state.career) params.set('career', state.career);
  if (state.status) params.set('status', state.status);
  if (state.period) params.set('period', state.period);
  if (state.period === 'semester1' || state.period === 'semester2') {
    if (state.year !== undefined) params.set('year', String(state.year));
  }
  if (state.period === 'custom') {
    if (state.from) params.set('from', state.from);
    if (state.to) params.set('to', state.to);
  }
  return params;
}

export function changePageSize(state: ApplicationsUrlState, pageSize: number): ApplicationsUrlState {
  return { ...state, pageSize, page: 1 };
}

export function changeFilters(
  state: ApplicationsUrlState,
  patch: Partial<
    Pick<
      ApplicationsUrlState,
      'search' | 'career' | 'status' | 'period' | 'year' | 'from' | 'to'
    >
  >,
): ApplicationsUrlState {
  return { ...state, ...patch, page: 1 };
}

export function changePage(state: ApplicationsUrlState, page: number): ApplicationsUrlState {
  return { ...state, page: Math.max(1, page) };
}

export function totalPagesFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function clampPage(state: ApplicationsUrlState, total: number): ApplicationsUrlState {
  const lastPage = totalPagesFor(total, state.pageSize);
  return state.page > lastPage ? { ...state, page: lastPage } : state;
}
