// TODO: Figure out what type <svg> elements are. Can't seem to find it.
// https://stackoverflow.com/questions/23664967/determining-the-svg-viewport-in-global-root-coordinates
// Modifications: Auto-linted

// Given an <svg> element, returns an object with the visible bounds
// expressed in local viewBox units, e.g.
// { x:-50, y:-50, width:100, height:100 }
export function calculateViewport(svg: any) {
  // http://phrogz.net/JS/_ReuseLicense.txt
  const style = getComputedStyle(svg),
    owidth = parseInt(style.width, 10),
    oheight = parseInt(style.height, 10),
    aspect = svg.preserveAspectRatio.baseVal,
    viewBox = svg.viewBox.baseVal;
  let width = (viewBox && viewBox.width) || owidth,
    height = (viewBox && viewBox.height) || oheight,
    x = viewBox ? viewBox.x : 0,
    y = viewBox ? viewBox.y : 0;
  if (!width || !height || !owidth || !oheight) return;
  if (
    aspect.align == aspect.SVG_PRESERVEASPECTRATIO_NONE ||
    !viewBox ||
    !viewBox.height
  ) {
    return { x: x, y: y, width: width, height: height };
  } else {
    const inRatio = viewBox.width / viewBox.height,
      outRatio = owidth / oheight;
    const meetFlag = aspect.meetOrSlice != aspect.SVG_MEETORSLICE_SLICE;
    const fillAxis =
      outRatio > inRatio ? (meetFlag ? "y" : "x") : meetFlag ? "x" : "y";
    if (fillAxis == "x") {
      height = width / outRatio;
      const diff = viewBox.height - height;
      switch (aspect.align) {
        case aspect.SVG_PRESERVEASPECTRATIO_UNKNOWN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMINYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMID:
          y += diff / 2;
          break;
        case aspect.SVG_PRESERVEASPECTRATIO_XMINYMAX:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMAX:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMAX:
          y += diff;
          break;
      }
    } else {
      width = height * outRatio;
      const diff = viewBox.width - width;
      switch (aspect.align) {
        case aspect.SVG_PRESERVEASPECTRATIO_UNKNOWN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMIN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMIDYMAX:
          x += diff / 2;
          break;
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMID:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMIN:
        case aspect.SVG_PRESERVEASPECTRATIO_XMAXYMAX:
          x += diff;
          break;
      }
    }
    return { x: x, y: y, width: width, height: height };
  }
}
