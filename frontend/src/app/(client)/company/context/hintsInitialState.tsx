import { StateHint } from '@/utils/hintsUtils';
import { CompanyTableKey, EmployeesTableKey } from './hintsCardsContent';

const initialCompanyTableHints: Record<CompanyTableKey, StateHint> = {
    "download": { show: true, showBody: true, id: 0 },
    "overview": { show: true, showBody: false, id: 1 },
    "employees": { show: true, showBody: false, id: 2 },
};

const initialEmployeesTableHints: Record<EmployeesTableKey, StateHint> = {
    "download": { show: true, showBody: true, id: 0 },
    "overview": { show: true, showBody: false, id: 1 },
    "unlock": { show: true, showBody: false, id: 2 },
};

export { initialCompanyTableHints, initialEmployeesTableHints };