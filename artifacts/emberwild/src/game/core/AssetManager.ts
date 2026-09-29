export type Asset = HTMLImageElement;

export class AssetManager {
  private readonly images = new Map<string, Asset>();

  async loadImage(id: string, source: string): Promise<Asset> {
    const cached = this.images.get(id);
    if (cached) {
      return cached;
    }

    const image = new Image();
    image.src = source;
    await image.decode();
    this.images.set(id, image);
    return image;
  }

  getImage(id: string): Asset | undefined {
    return this.images.get(id);
  }

  clear(): void {
    this.images.clear();
  }
}