class EkiPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunks = [];
    this.read = 0;
    this.port.onmessage = (event) => {
      if (event.data) this.chunks.push(event.data);
    };
  }

  process(_inputs, outputs) {
    const out = outputs[0][0];
    let index = 0;
    while (index < out.length) {
      if (!this.chunks.length) {
        out.fill(0, index);
        break;
      }
      const chunk = this.chunks[0];
      const take = Math.min(out.length - index, chunk.length - this.read);
      out.set(chunk.subarray(this.read, this.read + take), index);
      index += take;
      this.read += take;
      if (this.read >= chunk.length) {
        this.chunks.shift();
        this.read = 0;
      }
    }
    return true;
  }
}

class EkiMicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.limit = Math.max(1, Math.round(sampleRate / 10));
    this.pending = new Float32Array(this.limit);
    this.used = 0;
  }

  process(inputs, outputs) {
    const out = outputs[0] && outputs[0][0];
    if (out) out.fill(0);
    const input = inputs[0] && inputs[0][0];
    if (!input || !input.length) return true;
    let offset = 0;
    while (offset < input.length) {
      const take = Math.min(input.length - offset, this.pending.length - this.used);
      this.pending.set(input.subarray(offset, offset + take), this.used);
      this.used += take;
      offset += take;
      if (this.used === this.pending.length) {
        this.port.postMessage(this.pending.slice(0));
        this.used = 0;
      }
    }
    return true;
  }
}

registerProcessor('eki-pcm', EkiPcmProcessor);
registerProcessor('eki-mic', EkiMicProcessor);
