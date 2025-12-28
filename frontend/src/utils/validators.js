import { GAMES } from './constants';

export const validateGameType = (gameType) => {
  const validTypes = ['ultra_lotto_6_58', 'grand_lotto_6_55', 'super_lotto_6_49', 
                     'mega_lotto_6_45', 'lotto_6_42'];
  return validTypes.includes(gameType);
};

export const validateNumbers = (numbers, gameType) => {
  if (!numbers || numbers.length !== 6) return false;
  
  const game = GAMES[gameType];
  if (!game) return false;
  
  return numbers.every(num => 
    num >= game.minNumber && num <= game.maxNumber
  );
};

