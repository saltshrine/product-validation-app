import type MatchStrategy from './match_strategy.js'

export default class NonSensitiveMatchStrategy implements MatchStrategy {
  match(char1: string, char2: string): boolean {
    return char1.toLowerCase() === char2.toLowerCase()
  }
}
