import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import LegislationChatbot from '../LegislationChatbot';
import feedbackApi from '../../services/feedbackApi';

jest.mock('../../services/feedbackApi');

test('user can submit feedback using beğendim button', () => {
  feedbackApi.submitFeedback.mockImplementation(() => Promise.resolve());

  const { getByText } = render(<LegislationChatbot />);
  const likeButton = getByText('beğendim');

  fireEvent.click(likeButton);

  expect(feedbackApi.submitFeedback).toHaveBeenCalledWith({ feedback: 'like' });
});

test('user can submit feedback using beğenmedim button', () => {
  feedbackApi.submitFeedback.mockImplementation(() => Promise.resolve());

  const { getByText } = render(<LegislationChatbot />);
  const dislikeButton = getByText('beğenmedim');

  fireEvent.click(dislikeButton);

  expect(feedbackApi.submitFeedback).toHaveBeenCalledWith({ feedback: 'dislike' });
});