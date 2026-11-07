// Inline vector icons: no emoji fonts, external icon service or runtime dependency.
const paths={
 repair:'<path d="M14 6a6 6 0 0 0-8 8l-4 4a3 3 0 0 0 4 4l4-4a6 6 0 0 0 8-8l-4 4-4-4 4-4Z"/>',
 back:'<path d="m12 4-8 8 8 8M4 12h17"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 edit:'<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m13 6 5 5"/>',
 card:'<rect x="2" y="4" width="20" height="16" rx="3"/><path d="M2 9h20M6 15h4"/>',
 refresh:'<path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6M4 17a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/>',
 logout:'<path d="M9 3H4v18h5m5-15 6 6-6 6m-6-6h12"/>', 
 bolt:'<path d="m13 2-9 12h7l-1 8L21 9h-8Z"/>',search:'<circle cx="10.5" cy="10.5" r="7"/><path d="m16 16 5 5"/>',filter:'<path d="M3 6h18M3 12h18M3 18h18M7 3v6m10 0v6M9 15v6"/>',shop:'<path d="m3 9 2-6h14l2 6M4 9v12h16V9M9 21v-7h6v7"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',bag:'<rect x="5" y="6" width="14" height="16" rx="3"/><path d="M9 6V4a3 3 0 0 1 6 0v2m-6 4a3 3 0 0 0 6 0"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-12 0h12m-8 12h4"/>',arrow:'<path d="M6 18 18 6M7 6h11v11"/>',shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
 laptop:'<rect x="3" y="3" width="18" height="13" rx="2"/><path d="m2 20 2-4h16l2 4Z"/>',
 charger:'<path d="M9 2v4m6-4v4M7 6h10v4a5 5 0 0 1-10 0Zm5 9v7"/>',
 camera:'<path d="m8 5 2-3h4l2 3h4a2 2 0 0 1 2 2v12H2V7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/>',
 headphones:'<path d="M3 14v-3a9 9 0 0 1 18 0v3"/><rect x="2" y="12" width="5" height="9" rx="2"/><rect x="17" y="12" width="5" height="9" rx="2"/>',
 speaker:'<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="6" r="1"/>',
 mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
 box:'<path d="m3 6 9-4 9 4v12l-9 4-9-4Zm0 0 9 5 9-5m-9 5v11M7.5 4l9 5"/>',
 gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v10h14V12M12 8v14"/><path d="M12 8S4 9 5 4c1-4 7 0 7 4Zm0 0s8 1 7-4c-1-4-7 0-7 4Z"/>',
 heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
 star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2l-5-4.9 6.9-1Z"/>',
 truck:'<path d="M1 4h13v13H1Zm13 5h5l4 5v3h-9"/><circle cx="5" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
 check:'<path d="m4 12 5 5L20 6"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 navigation:'<path d="m21 3-6 18-4-8-8-4Z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
};
export function icon(name,{filled=false}={}){return `<svg class="ui-icon" viewBox="0 0 24 24" fill="${filled?'currentColor':'none'}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.box}</svg>`;}
export const productIcons={Laptop:icon('laptop'),Charger:icon('charger'),Camera:icon('camera'),Headphone:icon('headphones'),Speaker:icon('speaker'),Microphone:icon('mic'),Other:icon('box')};
