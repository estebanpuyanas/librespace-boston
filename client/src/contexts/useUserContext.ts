import { useContext } from 'react';
import UserContext, { UserContextType } from './UserContext';

const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === null) throw new Error('useUserContext must be used inside UserContext.Provider');
  return context;
};

export default useUserContext;
