// One link per area: <site>/<code> (or <site>/?a=<code>, which also works when run locally).
// The page then loads only that area's rows; without a code it asks for one. To add an area, add a line with a new random code.
// Note: the data files are still public, so a code only hides data from the page, it does not secure it.
window.SD_AREAS = {
  'vjfput4h': { region: true },
  'u9fibc': { phak: 'บางขุนเทียน' },
  'ztt5zs': { phak: 'บางบอน' },
  'vi5bu6': { phak: 'บางขุนเทียน', khet: 'การเคหะ' },
  'gjn8j7': { phak: 'บางขุนเทียน', khet: 'ท่าข้าม' },
  '8hquqf': { phak: 'บางขุนเทียน', khet: 'บางขุนเทียน' },
  'yyyj3w': { phak: 'บางขุนเทียน', khet: 'เทียนทะเล' },
  'avuth9': { phak: 'บางขุนเทียน', khet: 'เพชรทองคำ' },
  'wur6zt': { phak: 'บางบอน', khet: 'กาญจนาภิเษก' },
  'a8mqsq': { phak: 'บางบอน', khet: 'กำนันแม้น' },
  'tzna26': { phak: 'บางบอน', khet: 'บางบอน' },
  'sagwdi': { phak: 'บางขุนเทียน', khet: 'การเคหะ', tambon: 'ศรัญญา' },
  'xsp8k7': { phak: 'บางขุนเทียน', khet: 'การเคหะ', tambon: 'เคหะรุ่งโรจน์' },
  'f288xe': { phak: 'บางขุนเทียน', khet: 'ท่าข้าม', tambon: 'จุลพงษ์' },
  'vk6792': { phak: 'บางขุนเทียน', khet: 'ท่าข้าม', tambon: 'สินทวี' },
  'ruq5tb': { phak: 'บางขุนเทียน', khet: 'บางขุนเทียน', tambon: 'พระราม 2' },
  '72z8hz': { phak: 'บางขุนเทียน', khet: 'บางขุนเทียน', tambon: 'มั่งมี' },
  'ypisqs': { phak: 'บางขุนเทียน', khet: 'เทียนทะเล', tambon: 'พิศาล' },
  'tru9ep': { phak: 'บางขุนเทียน', khet: 'เทียนทะเล', tambon: 'มีสุข' },
  'pa2hwe': { phak: 'บางขุนเทียน', khet: 'เทียนทะเล', tambon: 'เทียนทะเล' },
  '3zhein': { phak: 'บางขุนเทียน', khet: 'เพชรทองคำ', tambon: 'วงแหวนชัชวาลย์' },
  'cq2tuw': { phak: 'บางขุนเทียน', khet: 'เพชรทองคำ', tambon: 'เพชรทองคำ' },
  'ey8279': { phak: 'บางบอน', khet: 'กาญจนาภิเษก', tambon: 'ดีเค' },
  'ngrtng': { phak: 'บางบอน', khet: 'กาญจนาภิเษก', tambon: 'ศิริชัย' },
  'mjmpdq': { phak: 'บางบอน', khet: 'กาญจนาภิเษก', tambon: 'เอสเค' },
  'f6aury': { phak: 'บางบอน', khet: 'กำนันแม้น', tambon: 'ปิ่นทอง' },
  '88ujxm': { phak: 'บางบอน', khet: 'กำนันแม้น', tambon: 'แม้นทอง' },
  '4eqtks': { phak: 'บางบอน', khet: 'กำนันแม้น', tambon: 'ไทรทอง' },
  'bs83my': { phak: 'บางบอน', khet: 'บางบอน', tambon: 'พระปิ่น 5' },
  'b8dtc5': { phak: 'บางบอน', khet: 'บางบอน', tambon: 'ศึกษานารี' },
};

(function () {
  const qs = new URLSearchParams(location.search);
  const code = (qs.get('a') || '').trim().toLowerCase();
  // p=1 means 404.html redirected <site>/<code> here: put the short address back in the bar.
  if (code && qs.get('p') === '1') { try { history.replaceState(null, '', location.pathname.replace(/[^/]*$/, '') + code + location.hash); } catch (e) {} }
  window.SD_CODE = code;
  const hit = code && Object.prototype.hasOwnProperty.call(window.SD_AREAS, code) ? window.SD_AREAS[code] : null;
  window.SD_AREA = !hit ? false : hit.region ? null : hit; // null = whole region, false = no code or an unknown one
})();
