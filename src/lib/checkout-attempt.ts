import type { CheckoutAttempt } from '@/types/orders'
const key=(userId:string)=>`kurio.checkout.attempt.${userId}`
export function readAttempt(userId:string):CheckoutAttempt|null {
  try {const stored=localStorage.getItem(key(userId));return stored?JSON.parse(stored) as CheckoutAttempt:null} catch{return null}
}
export function saveAttempt(userId:string,attempt:CheckoutAttempt|null) {if(attempt)localStorage.setItem(key(userId),JSON.stringify(attempt));else localStorage.removeItem(key(userId))}
export function clearAttempts() {for(const name of Object.keys(localStorage))if(name.startsWith('kurio.checkout.attempt.'))localStorage.removeItem(name)}
