/**
 * The only way the view reads auth state. `select` + Noun naming; derived/memoized
 * selectors use createSelector for referential stability (constitution §4).
 */
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../index';

const selectAuth = (state: RootState) => state.auth;

export const selectAuthStatus = createSelector(selectAuth, (a) => a.status);
export const selectCurrentUser = createSelector(selectAuth, (a) => a.user);
export const selectFieldErrors = createSelector(selectAuth, (a) => a.fieldErrors);
export const selectFormError = createSelector(selectAuth, (a) => a.formError);
export const selectIsAuthenticated = createSelector(
  selectAuth,
  (a) => a.status === 'authenticated',
);
