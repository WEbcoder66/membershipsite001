// src/lib/contentService.ts
import { Content, MembershipTier, ServiceResponse } from './types';

export function getAllContent(): Content[] {
  try {
    const content = localStorage.getItem('siteContent');
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.error('Error getting content:', error);
    return [];
  }
}

export function saveContent(content: Content[]): void {
  try {
    localStorage.setItem('siteContent', JSON.stringify(content));
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

export function addContent(content: Content): Content[] {
  try {
    const currentContent = getAllContent();
    const newContent = [content, ...currentContent];
    saveContent(newContent);
    return newContent;
  } catch (error) {
    console.error('Error adding content:', error);
    throw error;
  }
}

export function deleteContent(contentId: string): Content[] {
  try {
    const currentContent = getAllContent();
    const newContent = currentContent.filter(content => content.id !== contentId);
    saveContent(newContent);
    return newContent;
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

export function getContentById(contentId: string): Content | null {
  try {
    const currentContent = getAllContent();
    return currentContent.find(content => content.id === contentId) || null;
  } catch (error) {
    console.error('Error getting content by ID:', error);
    return null;
  }
}

export function updateContent(contentId: string, updates: Partial<Content>): Content[] {
  try {
    const currentContent = getAllContent();
    const newContent = currentContent.map(content => 
      content.id === contentId ? { ...content, ...updates } : content
    );
    saveContent(newContent);
    return newContent;
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

export function getContentByTier(tier: MembershipTier): Content[] {
  try {
    const currentContent = getAllContent();
    return currentContent.filter(content => content.tier === tier);
  } catch (error) {
    console.error('Error getting content by tier:', error);
    return [];
  }
}

export function searchContent(query: string): Content[] {
  try {
    const currentContent = getAllContent();
    const lowerQuery = query.toLowerCase();
    return currentContent.filter(content => 
      content.title.toLowerCase().includes(lowerQuery) ||
      content.description.toLowerCase().includes(lowerQuery) ||
      content.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

export function getContentByCategory(category: string): Content[] {
  try {
    const currentContent = getAllContent();
    return currentContent.filter(content => content.category === category);
  } catch (error) {
    console.error('Error getting content by category:', error);
    return [];
  }
}

export function getPopularContent(limit: number = 10): Content[] {
  try {
    const currentContent = getAllContent();
    return [...currentContent]
      .sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting popular content:', error);
    return [];
  }
}

export function getRecentContent(limit: number = 10): Content[] {
  try {
    const currentContent = getAllContent();
    return [...currentContent]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent content:', error);
    return [];
  }
}

export function incrementContentLikes(contentId: string): ServiceResponse<Content> {
  try {
    const currentContent = getAllContent();
    const contentIndex = currentContent.findIndex(content => content.id === contentId);
    
    if (contentIndex === -1) {
      return {
        success: false,
        error: 'Content not found'
      };
    }

    currentContent[contentIndex] = {
      ...currentContent[contentIndex],
      likes: currentContent[contentIndex].likes + 1
    };

    saveContent(currentContent);
    
    return {
      success: true,
      data: currentContent[contentIndex]
    };
  } catch (error) {
    console.error('Error incrementing likes:', error);
    return {
      success: false,
      error: 'Failed to increment likes'
    };
  }
}

export function incrementContentComments(contentId: string): ServiceResponse<Content> {
  try {
    const currentContent = getAllContent();
    const contentIndex = currentContent.findIndex(content => content.id === contentId);
    
    if (contentIndex === -1) {
      return {
        success: false,
        error: 'Content not found'
      };
    }

    currentContent[contentIndex] = {
      ...currentContent[contentIndex],
      comments: currentContent[contentIndex].comments + 1
    };

    saveContent(currentContent);
    
    return {
      success: true,
      data: currentContent[contentIndex]
    };
  } catch (error) {
    console.error('Error incrementing comments:', error);
    return {
      success: false,
      error: 'Failed to increment comments'
    };
  }
}