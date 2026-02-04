import apiClient from '../services/axios'; // your configured axios instance

export const getFinanceOverview = ({ start, end, memberId }) => {
  return apiClient.get('/finance/finance-overview', {
    params: {
      start,
      end,
      ...(memberId && { memberId })
    }
  });
};
