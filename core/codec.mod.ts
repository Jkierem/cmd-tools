const Decoder = new TextDecoder()
export const decode = (x: Uint8Array) => Decoder.decode(x)
const Encoder = new TextEncoder()
export const encode = (x: string) => Encoder.encode(x)