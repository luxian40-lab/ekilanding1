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

registerProcessor('eki-pcm', EkiPcmProcessor);
