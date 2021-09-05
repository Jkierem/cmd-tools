export const Decoder = new TextDecoder()
export const decode = (x: Uint8Array) => Decoder.decode(x)