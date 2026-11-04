import { PLAYABLE, type PlayableId } from './data/hatchlings'
import { formPortraitUrl, portraitUrl, type FormKey } from './render/sprites'

/** A playable identity may use a distinct sprite form of its base National Dex species. */
const PLAYABLE_FORMS: Partial<Record<PlayableId, FormKey>> = {
  shadowMewtwo: 'shadow',
}

export const playableForm = (id: PlayableId): FormKey | undefined => PLAYABLE_FORMS[id]

export const playablePortrait = (id: PlayableId, dex: number = PLAYABLE[id].line[0].dex, shiny = false): string => {
  const form = playableForm(id)
  return form ? formPortraitUrl(dex, form) : portraitUrl(dex, shiny)
}

export const playableShiny = (id: PlayableId, shiny: boolean): boolean => playableForm(id) ? false : shiny
