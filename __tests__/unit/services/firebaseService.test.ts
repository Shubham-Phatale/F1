import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { FirebaseService } from '@/services/firebaseService';
import { auth } from '@/config/firebase';

// Never hit the network: mock the modular firebase/auth SDK entirely.
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

// Never hit the network: mock the modular firebase/firestore SDK entirely.
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Stub the config module so importing firebaseService does not initialize the
// real Firebase app. `auth` is a mutable stub so tests can set `currentUser`.
jest.mock('@/config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

const mockedCreateUser = createUserWithEmailAndPassword as jest.Mock;
const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedSignOut = signOut as jest.Mock;
const mockedUpdateProfile = updateProfile as jest.Mock;
const mockedOnAuthStateChanged = onAuthStateChanged as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedUpdateDoc = updateDoc as jest.Mock;

describe('FirebaseService', () => {
  let service: FirebaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as { currentUser: unknown }).currentUser = null;
    service = new FirebaseService();
  });

  describe('signUp', () => {
    it('should create the user, set the display name, and return the basic user info', async () => {
      const fakeUser = { uid: 'abc123', email: 'new@user.com', displayName: null };
      mockedCreateUser.mockResolvedValueOnce({ user: fakeUser });
      mockedUpdateProfile.mockResolvedValueOnce(undefined);
      mockedDoc.mockReturnValueOnce('users/abc123');
      mockedSetDoc.mockResolvedValueOnce(undefined);

      const result = await service.signUp('new@user.com', 'password123', 'New User');

      expect(mockedCreateUser).toHaveBeenCalledWith(auth, 'new@user.com', 'password123');
      expect(mockedUpdateProfile).toHaveBeenCalledWith(fakeUser, { displayName: 'New User' });
      // signUp now also creates the Firestore profile document.
      expect(mockedSetDoc).toHaveBeenCalledWith(
        'users/abc123',
        expect.objectContaining({
          uid: 'abc123',
          email: 'new@user.com',
          displayName: 'New User',
          joinedAt: expect.any(String),
        })
      );
      expect(result).toEqual({
        uid: 'abc123',
        email: 'new@user.com',
        displayName: 'New User',
      });
    });

    it('should propagate errors from createUserWithEmailAndPassword', async () => {
      mockedCreateUser.mockRejectedValueOnce(new Error('auth/email-already-in-use'));

      await expect(
        service.signUp('taken@user.com', 'password123', 'Taken')
      ).rejects.toThrow('auth/email-already-in-use');
      expect(mockedUpdateProfile).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should sign in and return the mapped user info', async () => {
      const fakeUser = { uid: 'user-1', email: 'user@one.com', displayName: 'User One' };
      mockedSignIn.mockResolvedValueOnce({ user: fakeUser });

      const result = await service.login('user@one.com', 'secret');

      expect(mockedSignIn).toHaveBeenCalledWith(auth, 'user@one.com', 'secret');
      expect(result).toEqual({
        uid: 'user-1',
        email: 'user@one.com',
        displayName: 'User One',
      });
    });

    it('should normalize null email/displayName to empty strings', async () => {
      const fakeUser = { uid: 'user-2', email: null, displayName: null };
      mockedSignIn.mockResolvedValueOnce({ user: fakeUser });

      const result = await service.login('user@two.com', 'secret');

      expect(result).toEqual({ uid: 'user-2', email: '', displayName: '' });
    });

    it('should propagate errors from a rejected sign-in', async () => {
      mockedSignIn.mockRejectedValueOnce(new Error('auth/wrong-password'));

      await expect(service.login('user@one.com', 'bad')).rejects.toThrow(
        'auth/wrong-password'
      );
    });
  });

  describe('logout', () => {
    it('should call signOut with auth', async () => {
      mockedSignOut.mockResolvedValueOnce(undefined);

      await service.logout();

      expect(mockedSignOut).toHaveBeenCalledWith(auth);
    });
  });

  describe('getCurrentUser', () => {
    it('should map auth.currentUser when signed in', () => {
      (auth as { currentUser: unknown }).currentUser = {
        uid: 'cur-1',
        email: 'cur@user.com',
        displayName: 'Current User',
      };

      expect(service.getCurrentUser()).toEqual({
        uid: 'cur-1',
        email: 'cur@user.com',
        displayName: 'Current User',
      });
    });

    it('should return null when no user is signed in', () => {
      (auth as { currentUser: unknown }).currentUser = null;

      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('onAuthChange', () => {
    it('should register a listener and return the unsubscribe function', () => {
      const unsubscribe = jest.fn();
      mockedOnAuthStateChanged.mockReturnValueOnce(unsubscribe);

      const cb = jest.fn();
      const returned = service.onAuthChange(cb);

      expect(mockedOnAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
      expect(returned).toBe(unsubscribe);
    });

    it('should invoke the callback with the mapped user when auth state changes', () => {
      let capturedListener: (user: unknown) => void = () => {};
      mockedOnAuthStateChanged.mockImplementationOnce((_auth, listener) => {
        capturedListener = listener;
        return jest.fn();
      });

      const cb = jest.fn();
      service.onAuthChange(cb);

      capturedListener({ uid: 'x', email: 'x@y.com', displayName: 'X' });
      expect(cb).toHaveBeenCalledWith({ uid: 'x', email: 'x@y.com', displayName: 'X' });

      capturedListener(null);
      expect(cb).toHaveBeenCalledWith(null);
    });
  });

  describe('createUserProfile', () => {
    it('should call setDoc with the profile document', async () => {
      const profile = {
        uid: 'p-1',
        email: 'p@one.com',
        displayName: 'Profile One',
        joinedAt: '2026-07-04T00:00:00.000Z',
      };
      mockedDoc.mockReturnValueOnce('users/p-1');
      mockedSetDoc.mockResolvedValueOnce(undefined);

      await service.createUserProfile(profile);

      expect(mockedDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'p-1');
      expect(mockedSetDoc).toHaveBeenCalledWith('users/p-1', profile);
    });
  });

  describe('getUserProfile', () => {
    it('should return the profile data when the document exists', async () => {
      const data = {
        uid: 'p-2',
        email: 'p@two.com',
        displayName: 'Profile Two',
        joinedAt: '2026-07-04T00:00:00.000Z',
      };
      mockedDoc.mockReturnValueOnce('users/p-2');
      mockedGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => data,
      });

      const result = await service.getUserProfile('p-2');

      expect(mockedDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'p-2');
      expect(result).toEqual(data);
    });

    it('should return null when the document does not exist', async () => {
      mockedDoc.mockReturnValueOnce('users/missing');
      mockedGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => undefined,
      });

      const result = await service.getUserProfile('missing');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    it('should call updateDoc with the partial update', async () => {
      const partial = { bio: 'Updated bio', favoriteDriverId: 'max_verstappen' };
      mockedDoc.mockReturnValueOnce('users/p-3');
      mockedUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateUserProfile('p-3', partial);

      expect(mockedDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'p-3');
      expect(mockedUpdateDoc).toHaveBeenCalledWith('users/p-3', partial);
    });
  });
});
