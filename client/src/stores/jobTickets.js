import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as jobTicketService from '../services/jobTickets';

export const useJobTicketsStore = defineStore('jobTickets', () => {
  const tickets = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Group tickets by stage for Kanban board
  const ticketsByStage = computed(() => {
    const grouped = {};
    const stages = [
      'NEW',
      'BID_SUBMITTED',
      'CLIENT_REPLIED',
      'INTERVIEW_SCHEDULED',
      'INTERVIEW_DONE',
      'OFFER_CONTRACT',
      'IN_PROGRESS',
      'WON',
      'LOST_CLOSED'
    ];
    
    stages.forEach(stage => {
      grouped[stage] = tickets.value.filter(ticket => ticket.currentStage === stage);
    });
    
    return grouped;
  });

  const fetchTickets = async (filters = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await jobTicketService.fetchJobTickets(filters);
      if (response.ok && response.data) {
        tickets.value = response.data.tickets || [];
        pagination.value = response.data.pagination || pagination.value;
      } else {
        throw new Error(response.message || 'Failed to fetch tickets');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch job tickets';
      tickets.value = [];
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchTicket = async (id) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await jobTicketService.fetchJobTicket(id);
      if (response.ok && response.data) {
        // Update ticket in store if it exists
        const index = tickets.value.findIndex(t => t._id === id);
        if (index !== -1) {
          tickets.value[index] = response.data.ticket;
        }
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to fetch ticket');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch job ticket';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const moveStage = async (ticketId, toStage, reason = '') => {
    try {
      const response = await jobTicketService.moveTicketStage(ticketId, toStage, reason);
      if (response.ok && response.data) {
        // Update ticket in store
        const index = tickets.value.findIndex(t => t._id === ticketId);
        if (index !== -1) {
          tickets.value[index] = response.data.ticket;
        }
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to move ticket stage');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to move ticket stage';
      throw err;
    }
  };

  const updateTicket = async (ticketId, data) => {
    try {
      const response = await jobTicketService.updateJobTicket(ticketId, data);
      if (response.ok && response.data) {
        // Update ticket in store
        const index = tickets.value.findIndex(t => t._id === ticketId);
        if (index !== -1) {
          tickets.value[index] = response.data.ticket;
        }
        return response.data.ticket;
      } else {
        throw new Error(response.message || 'Failed to update ticket');
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message || 'Failed to update ticket';
      throw err;
    }
  };

  return {
    tickets,
    loading,
    error,
    pagination,
    ticketsByStage,
    fetchTickets,
    fetchTicket,
    moveStage,
    updateTicket
  };
});

