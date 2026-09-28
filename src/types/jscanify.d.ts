declare module "jscanify/client" {
  export default class Jscanify {
    constructor();
    highlightPaper(
      image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    ): HTMLCanvasElement;
    extractPaper(
      image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
      resultWidth: number,
      resultHeight: number,
      cornerPoints?: unknown,
    ): HTMLCanvasElement | null;
    findPaperContour(mat: unknown): unknown;
    getCornerPoints(contour: unknown, mat?: unknown): unknown;
  }
}
