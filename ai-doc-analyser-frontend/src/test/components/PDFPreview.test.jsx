import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PDFPreview from '../../components/PDFPreview';

describe('PDFPreview Component', () => {
  it('should render preview container', () => {
    const mockContent = 'This is test PDF content for preview.';
    
    render(<PDFPreview content={mockContent} />);
    
    const previewElement = screen.getByText(mockContent);
    expect(previewElement).toBeInTheDocument();
  });

  it('should handle empty content', () => {
    render(<PDFPreview content="" />);
    
    expect(screen.getByText('No content to preview')).toBeInTheDocument();
  });

  it('should handle long content with truncation', () => {
    const longContent = 'A'.repeat(2000); // Long content
    
    render(<PDFPreview content={longContent} />);
    
    // Should show truncated content
    const previewElement = screen.getByText(/^A+.*\.\.\.$/);
    expect(previewElement).toBeInTheDocument();
  });

  it('should preserve line breaks in content', () => {
    const contentWithBreaks = 'Line 1\nLine 2\nLine 3';
    render(<PDFPreview content={contentWithBreaks} />);
    // Use regex to match multi-line content rendered with preserved line breaks
    const previewElement = screen.getByText(/Line 1\s*Line 2\s*Line 3/);
    expect(previewElement).toBeInTheDocument();
  });

  it('should have proper styling for readability', () => {
    const mockContent = 'Test content';
    
    const { container } = render(<PDFPreview content={mockContent} />);
    const previewContainer = container.firstChild;
    
    expect(previewContainer).toHaveStyle({
      padding: '16px',
      backgroundColor: '#fafafa',
    });
  });

  it('should handle special characters', () => {
    const specialContent = 'Content with émojis 🎉 and spéciál characters';
    
    render(<PDFPreview content={specialContent} />);
    
    expect(screen.getByText(specialContent)).toBeInTheDocument();
  });

  it('should be scrollable for long content', () => {
    const longContent = 'Very long content. '.repeat(100);
    
    const { container } = render(<PDFPreview content={longContent} />);
    const previewContainer = container.firstChild;
    
    expect(previewContainer).toHaveStyle({
      overflowY: 'auto',
      maxHeight: '300px',
    });
  });
});