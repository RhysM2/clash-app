import axios from 'axios';
import { API_URL } from './config';

// Get player profile
export const getPlayerProfile = async (playerTag) => {
  try {
    const cleanTag = playerTag.replace('#', '');
    const response = await axios.get(`${API_URL}/player/${cleanTag}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch player profile');
  }
};

// Get card counts with filters
export const getCardCounts = async (playerTag, filters = {}) => {
  try {
    const cleanTag = playerTag.replace('#', '');
    const params = new URLSearchParams();
    params.append('tag', cleanTag);

    if (filters.types && filters.types.length > 0) {
      params.append('types', filters.types.join(','));
    }

    if (filters.timeRange && filters.timeRange !== 'all') {
      params.append('timeRange', filters.timeRange);
    }

    const response = await axios.get(`${API_URL}/cardcounts?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch card data');
  }
};

// Get all cards metadata
export const getAllCards = async () => {
  try {
    const response = await axios.get(`${API_URL}/cards`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch cards metadata');
  }
};
