import type MatchStrategy from './match_strategy.js'

export default class SensitiveMatchStrategy implements MatchStrategy {
  match(char1: string, char2: string): boolean {
    return char1 === char2
  }
}
