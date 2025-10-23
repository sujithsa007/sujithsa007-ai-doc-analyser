import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../../components/Header';

describe('Header Component', () => {
  it('should render the header with title', () => {
    render(<Header />);
    expect(screen.getByText(/AI Doc Analyser/i)).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Header />);
    expect(screen.getByText(/Upload any document.*and ask questions using AI/i)).toBeInTheDocument();
  });

  it('should have correct styling', () => {
    const { container } = render(<Header />);
    const headerDiv = container.firstChild;
    expect(headerDiv).toHaveStyle({ backgroundColor: '#fff' });
  });

  it('should have semantic HTML structure', () => {
    render(<Header />);
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('should include document icon', () => {
    render(<Header />);
    const icon = screen.getByLabelText('Document icon');
    expect(icon).toBeInTheDocument();
  });
});
