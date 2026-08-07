import { StoreStatus } from './types';

export function routeForStatus(status: StoreStatus): string {
  switch (status) {
    case 'pending':
      return '/pending';
    case 'rejected':
      return '/rejected';
    case 'suspended':
      return '/suspended';
    case 'active':
    default:
      return '/dashboard';
  }
}
