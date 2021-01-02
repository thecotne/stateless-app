export type Assignable<A, B> = A extends B ? true : false
export type Interchangeable<A, B> = A extends B ? (B extends A ? true : false) : false

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function staticAssert<A extends true> (): void { }

export function identity<T> (value: T): T { return value }
