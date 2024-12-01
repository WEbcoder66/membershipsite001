import { Content, MembershipTier, ServiceResponse } from './types';

const API_BASE = '/api/content';

export async function getAllContent(): Promise<Content[]> {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch content');
    return response.json();
  } catch (error) {
    console.error('Error getting content:', error);
    return [];
  }
}

export async function saveContent(content: Content[]): Promise<void> {
  try {
    const response = await fetch(API_BASE + '/batch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!response.ok) throw new Error('Failed to save content');
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

export async function addContent(content: Content): Promise<Content> {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(content),
    });
    if (!response.ok) throw new Error('Failed to add content');
    return response.json();
  } catch (error) {
    console.error('Error adding content:', error);
    throw error;
  }
}

export async function deleteContent(contentId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/${contentId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete content');
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

export async function getContentById(contentId: string): Promise<Content | null> {
  try {
    const response = await fetch(`${API_BASE}/${contentId}`);
    if (!response.ok) throw new Error('Failed to fetch content');
    return response.json();
  } catch (error) {
    console.error('Error getting content by ID:', error);
    return null;
  }
}

export async function updateContent(contentId: string, updates: Partial<Content>): Promise<Content> {
  try {
    const response = await fetch(`${API_BASE}/${contentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update content');
    return response.json();
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

export async function getContentByTier(tier: MembershipTier): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/tier/${tier}`);
    if (!response.ok) throw new Error('Failed to fetch content by tier');
    return response.json();
  } catch (error) {
    console.error('Error getting content by tier:', error);
    return [];
  }
}

export async function searchContent(query: string): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search content');
    return response.json();
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

export async function getContentByCategory(category: string): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/category/${encodeURIComponent(category)}`);
    if (!response.ok) throw new Error('Failed to fetch content by category');
    return response.json();
  } catch (error) {
    console.error('Error getting content by category:', error);
    return [];
  }
}

export async function getPopularContent(limit: number = 10): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/popular?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch popular content');
    return response.json();
  } catch (error) {
    console.error('Error getting popular content:', error);
    return [];
  }
}

export async function getRecentContent(limit: number = 10): Promise<Content[]> {
  try {
    const response = await fetch(`${API_BASE}/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent content');
    return response.json();
  } catch (error) {
    console.error('Error getting recent content:', error);
    return [];
  }
}

export async function incrementContentLikes(contentId: string): Promise<ServiceResponse<Content>> {
  try {
    const response = await fetch(`${API_BASE}/${contentId}/like`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to increment likes');
    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error incrementing likes:', error);
    return {
      success: false,
      error: 'Failed to increment likes'
    };
  }
}

export async function incrementContentComments(contentId: string): Promise<ServiceResponse<Content>> {
  try {
    const response = await fetch(`${API_BASE}/${contentId}/comment`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to increment comments');
    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error incrementing comments:', error);
    return {
      success: false,
      error: 'Failed to increment comments'
    };
  }
}