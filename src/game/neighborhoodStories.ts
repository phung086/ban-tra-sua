import {CITY_EPISODES,PERSONALITIES} from './cityEpisodes';
import type {GameState,InventoryKey} from './types';
import {CITY_PLACES,nearCityPlace,type CityPlace} from './cityMap';
import type {Position} from './service';

export type ResidentId='hanh'|'thu'|'nam'|'minh'|'binh'|'lan';
export type ConversationTone='warm'|'playful'|'brusque';
export type MissionStatus='active'|'ready'|'complete';
export interface NeighborhoodMission {id:string;step:number;status:MissionStatus;outcome?:'paid'|'kind';}
export interface NeighborhoodStories {
  nodes:Partial<Record<ResidentId,string>>;
  tones:Partial<Record<ResidentId,ConversationTone>>;
  missions:NeighborhoodMission[];
  bonds:Partial<Record<ResidentId,number>>;
  choices:string[];
}
export const RESIDENTS = [
  {id:'hanh' as const,name:'Cô Hạnh',role:'Bán hàng ở chợ',place:'market' as const,customerId:'hanh',color:'#778a64',intro:'Cô đang xếp hàng sáng, vừa nhìn thấy bạn liền gọi lại.'},
  {id:'thu' as const,name:'Cô Thu',role:'Hàng xóm khu tập thể',place:'apartments' as const,customerId:'mai',color:'#9d7d8b',intro:'Cô Thu ngồi trước cầu thang, bên cạnh một chiếc giỏ đi chợ.'},
  {id:'nam' as const,name:'Anh Nam',role:'Chủ hiệu sách',place:'library' as const,customerId:'khanh',color:'#75949b',intro:'Anh Nam đang chuẩn bị buổi đọc sách cho các em trong xóm.'},
  {id:'minh' as const,name:'Bác Minh',role:'Người hay đi dạo quanh hồ',place:'lake' as const,customerId:'hai',color:'#9d8c6c',intro:'Bác Minh dừng chân bên hồ, nhìn quanh như đang tìm gì đó.'},
  {id:'binh' as const,name:'Bác Bình',role:'Chăm vườn hoa trong xóm',place:'park' as const,customerId:'tu',color:'#849777',intro:'Bác Bình đang loay hoay bên mấy chậu cây mới.'},
  {id:'lan' as const,name:'Lan',role:'Học sinh trường An Hòa',place:'school' as const,customerId:'lan',color:'#ad8c71',intro:'Lan và các bạn đang làm gian hàng cho hội chợ của trường.'},
];
export function resident(id:ResidentId) {return RESIDENTS.find(r=>r.id===id)!;}
export function residentAt(position:Position) {return RESIDENTS.find(r=>nearCityPlace(position,r.place));}
export interface MissionStep {place:CityPlace;title:string;verb:string;minutes:number;energy:number;item?:string;}
export interface MissionDefinition {
  id:string;resident:ResidentId;episode?:number;title:string;brief:string;branch:string;
  steps:MissionStep[];cash:number;fans:number;goodwill:number;
  report:string;after:string;gift?:{key:InventoryKey;count:number};
}
export const MISSIONS:MissionDefinition[]=[
  {id:'hanh-crates',resident:'hanh',title:'Một tay mở chợ',branch:'Giúp công việc',brief:'Giúp cô Hạnh xếp hàng sáng trước khi về tiệm.',steps:[{place:'market',title:'Xếp thùng trà lên sạp cô Hạnh',verb:'Xếp thùng trà',minutes:10,energy:6,item:'Thùng trà khô'},{place:'market',title:'Phân loại ly giấy và bao bì',verb:'Phân loại bao bì',minutes:8,energy:4,item:'Bao bì đã xếp'}],cash:18000,fans:1,goodwill:2,gift:{key:'classicMilkTea',count:4},report:'Sạp gọn gàng hẳn rồi. Cô gửi tiền công và ít trà ngon nhé.',after:'Có người đỡ một tay, cô kịp đón lượt khách đầu ngày.'},
  {id:'hanh-neighbor',resident:'hanh',title:'Gói hàng của cô Thu',branch:'Giúp hàng xóm',brief:'Nhận gói hàng cô Thu nhờ mua và mang đến khu tập thể.',steps:[{place:'market',title:'Nhận gói hàng đã trả tiền',verb:'Nhận gói hàng',minutes:3,energy:1,item:'Gói hàng của cô Thu'},{place:'apartments',title:'Đặt gói hàng trước cửa cô Thu',verb:'Giao gói hàng',minutes:3,energy:2}],cash:12000,fans:3,goodwill:3,report:'Cô Thu vừa gọi cảm ơn. Cháu chịu khó quá, cả xóm sẽ biết tiệm của cháu.',after:'Từ hôm ấy cô Thu thường rủ hàng xóm ghé tiệm.'},
  {id:'thu-groceries',resident:'thu',title:'Giỏ hàng buổi sáng',branch:'Đi chợ giúp',brief:'Cô Thu nhờ nhận rau đã đặt từ cô Hạnh.',steps:[{place:'market',title:'Nhận giỏ rau cô Thu đã đặt',verb:'Nhận giỏ rau',minutes:5,energy:2,item:'Giỏ rau của cô Thu'},{place:'apartments',title:'Mang giỏ rau về cho cô Thu',verb:'Đặt giỏ rau',minutes:3,energy:2}],cash:16000,fans:2,goodwill:3,report:'Đúng giỏ của cô rồi. Nhờ cháu mà hôm nay cô đỡ phải đi xa.',after:'Cô Thu nhớ bạn là người đã giúp cô đi chợ.'},
  {id:'thu-books',resident:'thu',title:'Những cuốn sách cũ',branch:'Tặng sách trong xóm',brief:'Cô Thu muốn tặng sách của cháu mình cho hiệu sách.',steps:[{place:'apartments',title:'Gói chồng sách cũ của cô Thu',verb:'Gói sách',minutes:7,energy:3,item:'Sách tặng từ cô Thu'},{place:'library',title:'Trao sách cho anh Nam',verb:'Trao chồng sách',minutes:4,energy:2}],cash:10000,fans:4,goodwill:4,report:'Anh Nam nhận sách rồi à? Thế là chúng lại có người đọc, cô vui lắm.',after:'Góc sách thiếu nhi có thêm sách nhờ bạn và cô Thu.'},
  {id:'nam-sort',resident:'nam',title:'Một buổi ở hiệu sách',branch:'Việc làm thêm',brief:'Giúp anh Nam phân loại sách và xếp góc đọc.',steps:[{place:'library',title:'Xếp sách theo từng chủ đề',verb:'Phân loại sách',minutes:12,energy:5,item:'Sách đã phân loại'},{place:'library',title:'Chuẩn bị chỗ ngồi đọc sách',verb:'Sắp góc đọc',minutes:8,energy:3}],cash:22000,fans:2,goodwill:2,report:'Góc đọc sẵn sàng rồi. Anh gửi tiền công, lần sau lại nhờ em nhé.',after:'Anh Nam tin tưởng nhờ bạn giúp chuẩn bị những buổi đọc sách.'},
  {id:'nam-invite',resident:'nam',title:'Hẹn nhau đọc sách',branch:'Kết nối trong xóm',brief:'Mang lời mời buổi đọc sách đến trường và khu tập thể.',steps:[{place:'school',title:'Gửi lời mời đọc sách cho Lan',verb:'Gửi lời mời',minutes:4,energy:2,item:'Lan đã nhận lời mời'},{place:'apartments',title:'Nhờ cô Thu rủ các cháu đến đọc',verb:'Mời các cháu trong xóm',minutes:4,energy:2}],cash:12000,fans:5,goodwill:4,report:'Có thêm các em ở trường và khu tập thể rồi. Buổi đọc sẽ vui hơn nhiều.',after:'Một buổi đọc sách kết nối học sinh và các gia đình.'},
  {id:'minh-find',resident:'minh',title:'Chiếc túi bỏ quên',branch:'Tìm đồ giúp bác',brief:'Bác Minh để quên túi vải ở điểm xe buýt.',steps:[{place:'bus',title:'Hỏi và nhận túi vải bác Minh để quên',verb:'Tìm túi vải',minutes:6,energy:2,item:'Túi vải của bác Minh'},{place:'lake',title:'Trả túi vải cho bác Minh',verb:'Trả túi vải',minutes:3,energy:1}],cash:14000,fans:2,goodwill:4,report:'Đúng túi của bác rồi, trong này còn quyển sổ cũ. May quá!',after:'Bác Minh rất quý việc bạn chịu khó tìm chiếc túi cho bác.'},
  {id:'minh-listen',resident:'minh',title:'Lời nhắn bên hồ',branch:'Lắng nghe chuyện xóm',brief:'Nghe bác Minh kể chuyện rồi chuyển lời nhắn tới cô Thu.',steps:[{place:'lake',title:'Ngồi nghe bác kể về khu An Hòa',verb:'Ngồi nghe chuyện',minutes:12,energy:0,item:'Lời nhắn của bác Minh'},{place:'apartments',title:'Nhắn cô Thu về buổi gặp mặt chiều',verb:'Chuyển lời nhắn',minutes:3,energy:1}],cash:8000,fans:4,goodwill:5,report:'Cô Thu nhận lời rồi. Bác cảm ơn cháu đã dành thời gian lắng nghe.',after:'Bạn biết thêm chuyện khu tập thể và kết nối hai người bạn cũ.'},
  {id:'binh-plants',resident:'binh',title:'Chậu cây mới của xóm',branch:'Làm vườn',brief:'Nhận cây ở chợ rồi giúp bác Bình trồng vào vườn hoa.',steps:[{place:'market',title:'Nhận chậu cây bác Bình đã đặt',verb:'Nhận chậu cây',minutes:4,energy:2,item:'Chậu cây mới'},{place:'park',title:'Trồng cây và tưới gốc',verb:'Trồng cây mới',minutes:12,energy:6}],cash:12000,fans:2,goodwill:4,report:'Thêm một mảng xanh cho xóm. Cháu giúp bác đúng lúc quá.',after:'Vườn hoa có chậu cây mới do bạn cùng bác Bình chăm sóc.'},
  {id:'binh-clean',resident:'binh',title:'Lối đi sạch trước tiệm',branch:'Dọn phố',brief:'Dọn vườn hoa và lối đi trước tiệm trà.',steps:[{place:'park',title:'Nhặt lá và dọn vườn hoa',verb:'Dọn vườn hoa',minutes:8,energy:4,item:'Túi lá đã gom'},{place:'shop',title:'Quét lối đi trước tiệm',verb:'Quét lối đi',minutes:8,energy:4}],cash:9000,fans:3,goodwill:4,report:'Lối đi sạch rồi, cả khách của tiệm cũng thích. Cảm ơn cháu nhé.',after:'Khách ghé tiệm thấy lối đi sạch và vườn hoa được chăm.'},
  {id:'lan-supplies',resident:'lan',title:'Gian hàng của lớp',branch:'Chuẩn bị hội chợ',brief:'Nhận bao bì Lan đã đặt, mang đến gian hàng của lớp.',steps:[{place:'market',title:'Nhận hộp ly và giấy cho lớp',verb:'Nhận đồ hội chợ',minutes:5,energy:2,item:'Hộp đồ hội chợ'},{place:'school',title:'Sắp ly và giấy tại gian hàng',verb:'Sắp gian hàng',minutes:8,energy:4}],cash:18000,fans:4,goodwill:2,report:'Gian hàng đủ đồ rồi! Chúng mình sẽ giới thiệu tiệm với các bạn.',after:'Lan nhớ tiệm Phố Nhỏ đã giúp lớp chuẩn bị hội chợ.'},
  {id:'lan-posters',resident:'lan',title:'Tấm thiệp mời trong xóm',branch:'Rủ mọi người tham gia',brief:'Nhờ hiệu sách và khu tập thể nhận thiệp mời hội chợ.',steps:[{place:'library',title:'Gửi thiệp hội chợ đến anh Nam',verb:'Gửi thiệp mời',minutes:3,energy:1,item:'Hiệu sách nhận thiệp'},{place:'apartments',title:'Gửi thiệp hội chợ cho cô Thu',verb:'Mời hàng xóm',minutes:3,energy:1}],cash:10000,fans:6,goodwill:3,report:'Có cả anh Nam và cô Thu đến nữa. Hội chợ sẽ vui lắm!',after:'Hội chợ trường đón thêm những gương mặt quen trong xóm.'},
];
MISSIONS.push(...CITY_EPISODES);
export interface DialogueChoice {id:string;text:string;tone?:ConversationTone;next?:string;mission?:string;claim?:'paid'|'kind';hint?:string;}
export interface DialogueNode {text:string;choices:DialogueChoice[];}
type Script=Record<string,DialogueNode>;
export const SCRIPTS:Record<ResidentId,Script>={
  hanh:{hello:{text:'Cháu là chủ tiệm trà mới phải không? Cô đang mở sạp, mà gói hàng cô Thu đặt cũng chưa có ai mang giúp.',choices:[{id:'work',text:'Cháu ở lại xếp sạp cùng cô nhé.',next:'work',hint:'Giúp cô mở chợ'},{id:'neighbor',text:'Để cháu mang hàng sang cô Thu.',next:'neighbor',hint:'Đi một chuyến tới khu tập thể'},{id:'later',text:'Cháu ghé chào cô, lát cháu quay lại.',next:'later'}]},work:{text:'Vậy cháu xếp thùng trà trước, rồi phân loại bao bì. Cô trả công và gửi thêm trà ngon.',choices:[{id:'accept',text:'Vâng, cháu bắt đầu ngay.',mission:'hanh-crates'},{id:'back',text:'Cháu muốn hỏi về gói hàng cô Thu.',next:'neighbor'}]},neighbor:{text:'Cô Thu đã trả tiền rồi. Cháu nhận gói này, mang đến khu tập thể rồi quay lại báo cô nhé.',choices:[{id:'accept',text:'Cháu nhận gói hàng cho cô Thu.',mission:'hanh-neighbor'},{id:'back',text:'Hay để cháu phụ cô xếp sạp trước.',next:'work'}]},later:{text:'Ừ, không sao. Khi nào rảnh cứ ghé, cô lúc nào cũng ở sạp này.',choices:[{id:'back',text:'Cháu sắp xếp được rồi, cô cần giúp gì?',next:'hello'}]}},
  thu:{hello:{text:'Sáng nay chân cô hơi mỏi. Cô có giỏ rau ở chợ cần nhận, và mấy cuốn sách cũ muốn tặng cho bọn trẻ.',choices:[{id:'groceries',text:'Cháu đi nhận rau giúp cô nhé.',next:'groceries',hint:'Một chuyến đi chợ'},{id:'books',text:'Cháu mang sách sang anh Nam cho cô.',next:'books',hint:'Góp sách cho góc đọc'},{id:'later',text:'Để cháu thu xếp tiệm rồi quay lại.',next:'later'}]},groceries:{text:'Cô Hạnh đã giữ giỏ rau cho cô. Cháu chỉ cần nhận rồi mang về đây, không phải trả tiền nữa.',choices:[{id:'accept',text:'Vâng, cháu đi nhận giỏ rau.',mission:'thu-groceries'},{id:'back',text:'Cháu hỏi thêm về những cuốn sách.',next:'books'}]},books:{text:'Những cuốn này cháu cô đọc xong rồi. Cháu gói lại, đem sang hiệu sách cho anh Nam nhé.',choices:[{id:'accept',text:'Cháu gói sách và mang đi.',mission:'thu-books'},{id:'back',text:'Cháu sẽ nhận giỏ rau trước.',next:'groceries'}]},later:{text:'Cô không vội đâu. Khi nào cháu rảnh, cô nhờ sau cũng được.',choices:[{id:'back',text:'Bây giờ cháu giúp được rồi.',next:'hello'}]}},
  nam:{hello:{text:'Chiều nay anh tổ chức buổi đọc sách. Anh thiếu người xếp góc đọc, mà lời mời vẫn chưa gửi hết.',choices:[{id:'sort',text:'Em giúp anh xếp sách và bàn ghế.',next:'sort',hint:'Làm thêm ở hiệu sách'},{id:'invite',text:'Em đi mời mọi người trong xóm.',next:'invite',hint:'Kết nối trường và khu tập thể'},{id:'later',text:'Em ghé xem sách, lát giúp anh nhé.',next:'later'}]},sort:{text:'Cảm ơn em. Mình phân loại sách thiếu nhi trước, rồi sắp góc đọc. Anh gửi em tiền công.',choices:[{id:'accept',text:'Em bắt đầu phân loại sách.',mission:'nam-sort'},{id:'back',text:'Để em đi gửi lời mời thì hơn.',next:'invite'}]},invite:{text:'Em nhắn Lan ở trường và cô Thu ở khu tập thể nhé. Ai có trẻ nhỏ đều được mời đến.',choices:[{id:'accept',text:'Em đi mời Lan và cô Thu.',mission:'nam-invite'},{id:'back',text:'Em ở lại xếp góc đọc.',next:'sort'}]},later:{text:'Cứ xem thoải mái. Việc chuẩn bị còn đó, rảnh thì mình nói tiếp.',choices:[{id:'back',text:'Giờ em có thể giúp anh rồi.',next:'hello'}]}},
  minh:{hello:{text:'Bác quên chiếc túi vải lúc xuống xe buýt. Trong túi có quyển sổ ghi chuyện khu An Hòa từ hồi còn ít nhà.',choices:[{id:'find',text:'Cháu ra điểm xe buýt hỏi giúp bác.',next:'find',hint:'Tìm túi rồi mang về hồ'},{id:'listen',text:'Bác kể cháu nghe về khu phố được không?',next:'listen',hint:'Lắng nghe và chuyển lời nhắn'},{id:'later',text:'Cháu có việc ở tiệm, lát cháu quay lại.',next:'later'}]},find:{text:'Bác nhớ để túi cạnh ghế chờ. Cháu hỏi người trực điểm xe rồi mang về đây giúp bác nhé.',choices:[{id:'accept',text:'Cháu đi tìm chiếc túi ngay.',mission:'minh-find'},{id:'back',text:'Cháu muốn nghe chuyện khu phố trước.',next:'listen'}]},listen:{text:'Ngày xưa cả xóm ngồi ở góc này uống trà. Bác muốn nhắn cô Thu chiều nay ra hồ gặp lại bạn cũ.',choices:[{id:'accept',text:'Cháu nghe bác kể rồi nhắn cô Thu.',mission:'minh-listen'},{id:'back',text:'Để cháu tìm chiếc túi giúp bác.',next:'find'}]},later:{text:'Cháu cứ làm việc của cháu. Bác ngồi đây thêm một lúc.',choices:[{id:'back',text:'Giờ cháu ở lại với bác được rồi.',next:'hello'}]}},
  binh:{hello:{text:'Mấy chậu cây mới ngoài chợ chưa mang về, mà lá rụng trước tiệm cũng nhiều. Cháu giúp bác một việc được không?',choices:[{id:'plants',text:'Cháu nhận cây và trồng cùng bác.',next:'plants',hint:'Thêm cây xanh cho vườn'},{id:'clean',text:'Cháu dọn vườn và quét trước tiệm.',next:'clean',hint:'Chăm lối đi của cả xóm'},{id:'later',text:'Hôm nay cháu chưa sắp xếp được.',next:'later'}]},plants:{text:'Chậu cây bác đã đặt và trả tiền ở chợ. Cháu nhận giúp rồi đem về đây, mình trồng vào luống nhé.',choices:[{id:'accept',text:'Cháu đi nhận cây.',mission:'binh-plants'},{id:'back',text:'Cháu chọn dọn lối đi trước.',next:'clean'}]},clean:{text:'Cháu gom lá trong vườn rồi quét lối đi trước tiệm. Khách và hàng xóm cùng đi qua đó.',choices:[{id:'accept',text:'Cháu bắt đầu dọn vườn.',mission:'binh-clean'},{id:'back',text:'Cháu đi nhận chậu cây thì hơn.',next:'plants'}]},later:{text:'Không sao cháu. Việc nhỏ thôi, khi rảnh lại cùng làm.',choices:[{id:'back',text:'Cháu thu xếp được rồi bác ạ.',next:'hello'}]}},
  lan:{hello:{text:'Lớp mình làm hội chợ nhưng còn thiếu đồ để sắp gian hàng. Thiệp mời cũng chưa gửi tới mọi người trong xóm.',choices:[{id:'supplies',text:'Mình giúp cậu nhận và sắp đồ nhé.',next:'supplies',hint:'Chuẩn bị gian hàng của lớp'},{id:'posters',text:'Mình mang thiệp mời quanh phố.',next:'posters',hint:'Rủ hàng xóm đến hội chợ'},{id:'later',text:'Mình phải trông tiệm, lát quay lại nhé.',next:'later'}]},supplies:{text:'Cô Hạnh giữ hộp ly và giấy lớp mình đặt rồi. Cậu nhận rồi mang về trường, cùng mình sắp gian hàng nhé.',choices:[{id:'accept',text:'Mình nhận đồ rồi quay lại.',mission:'lan-supplies'},{id:'back',text:'Hay mình giúp gửi thiệp mời.',next:'posters'}]},posters:{text:'Cậu gửi anh Nam và cô Thu giúp mình. Mình mong cả người lớn trong xóm cũng đến chơi!',choices:[{id:'accept',text:'Để mình mời anh Nam và cô Thu.',mission:'lan-posters'},{id:'back',text:'Mình chọn giúp sắp gian hàng.',next:'supplies'}]},later:{text:'Ừ, cậu trông tiệm trước đi. Khi nào rảnh mình nói tiếp.',choices:[{id:'back',text:'Mình quay lại giúp cậu rồi đây.',next:'hello'}]}},
};
export function initialStories():NeighborhoodStories {return {nodes:{},tones:{},missions:[],bonds:{},choices:[]};}
export function hydrateStories(value:Partial<NeighborhoodStories>|undefined):NeighborhoodStories {
  const initial=initialStories();if(!value||typeof value!=='object')return initial;
  for(const r of RESIDENTS) {
    const tone=value.tones?.[r.id];if(tone&&['warm','playful','brusque'].includes(tone))initial.tones[r.id]=tone;
    const node=value.nodes?.[r.id];if(node&&Object.hasOwn(SCRIPTS[r.id],node))initial.nodes[r.id]=node;
    const bond=value.bonds?.[r.id];if(typeof bond==='number'&&Number.isFinite(bond))initial.bonds[r.id]=Math.max(0,Math.min(1000,bond));
  }
  if(Array.isArray(value.missions)) for(const m of value.missions) {
    if(!m||typeof m!=='object')continue;
    const definition=MISSIONS.find(d=>d.id===m.id);
    if(!definition||initial.missions.some(existing=>{const d=missionDefinition(existing.id);return d.resident===definition.resident&&((d.episode??1)===(definition.episode??1)||existing.status!=='complete');}))continue;
    if((definition.episode??1)>1&&!initial.missions.some(existing=>{const d=missionDefinition(existing.id);return d.resident===definition.resident&&(d.episode??1)===(definition.episode??1)-1&&existing.status==='complete';}))continue;
    if(!Number.isInteger(m.step)||m.step<0||m.step>definition.steps.length)continue;
    const status=m.step===definition.steps.length?(m.status==='complete'?'complete':'ready'):'active';
    initial.missions.push({id:m.id,step:m.step,status,...(status==='complete'?{outcome:m.outcome==='kind'?'kind' as const:'paid' as const}:{})});
  }
  initial.choices=Array.isArray(value.choices)?value.choices.filter(s=>typeof s==='string').slice(-100):[];
  return initial;
}
export function missionDefinition(id:string) {return MISSIONS.find(m=>m.id===id)!;}
export function missionFor(stories:NeighborhoodStories,id:ResidentId) {const entries=stories.missions.filter(m=>missionDefinition(m.id).resident===id);return entries.find(m=>m.status!=='complete')??entries.at(-1);}
export function nearbyTask(stories:NeighborhoodStories,position:Position) {return stories.missions.find(m=>m.status==='active'&&nearCityPlace(position,missionDefinition(m.id).steps[m.step].place));}
export function missionObjective(m:NeighborhoodMission) {const d=missionDefinition(m.id);return m.status==='active'?d.steps[m.step]:{place:resident(d.resident).place,title:`Báo tin cho ${resident(d.resident).name}`,verb:'Trò chuyện để hoàn tất',minutes:0,energy:0};}
export function dialogueNode(stories:NeighborhoodStories,id:ResidentId):DialogueNode {
  const m=missionFor(stories,id);
  if(m) {
    const d=missionDefinition(m.id);
    if(m.status==='complete')return {text:`${d.after} ${m.outcome==='kind'?'Họ còn nhớ bạn đã giúp mà không nhận tiền công.':'Họ nhớ công việc bạn đã làm và muốn ghé tiệm ủng hộ.'} ${stories.tones[id]?PERSONALITIES[id][stories.tones[id]!]:''}`,choices:[...CITY_EPISODES.filter(next=>next.resident===id&&next.episode===(d.episode??1)+1).map(next=>({id:`episode:${next.id}`,text:next.title,mission:next.id,hint:`Chuyện ${next.episode} · ${next.branch}`})),{id:'tone:warm',text:'Mình giúp được là vui. Có gì cứ nhờ nhé.',tone:'warm'},{id:'tone:playful',text:'Có việc vui thì gọi “đội trưởng trà sữa” nhé!',tone:'playful'},{id:'tone:brusque',text:'Lần sau nói thẳng việc cần làm nhé, mình đang bận.',tone:'brusque'}]};
    if(m.status==='ready')return {text:d.report,choices:[{id:'paid',text:'Cảm ơn, mình nhận tiền công nhé.',claim:'paid',hint:`${d.cash.toLocaleString('vi-VN')} ₫ · ${d.goodwill} thiện cảm`},{id:'kind',text:'Mình giúp được là vui rồi, xin gửi lại tiền.',claim:'kind',hint:`Thêm 3 thiện cảm và 2 fan · không nhận tiền`}]};
    const objective=missionObjective(m);
    return {text:`${stories.tones[id]?PERSONALITIES[id][stories.tones[id]!]+' ':''}${d.brief} Việc tiếp theo: ${objective.title.toLowerCase()} tại ${CITY_PLACES[objective.place].name}. Làm xong quay lại gặp ${resident(id).name.toLowerCase()} nhé.`,choices:[]};
  }
  const node=SCRIPTS[id][stories.nodes[id]??'hello']??SCRIPTS[id].hello;
  const tone=stories.tones[id];
  return {...node,text:`${tone?PERSONALITIES[id][tone]+' ':''}${node.text}`,choices:[...node.choices,{id:'tone:warm',text:'Cháu sẽ làm cẩn thận, mình cứ nói nhẹ nhàng nhé.',tone:'warm',hint:'Chân thành · người đối diện bớt căng thẳng'},{id:'tone:playful',text:'Cho cháu thử làm “siêu nhân việc vặt” hôm nay!',tone:'playful',hint:'Pha trò · mỗi người phản ứng theo tính cách'},{id:'tone:brusque',text:'Nói nhanh việc cần làm đi, cháu còn bận!',tone:'brusque',hint:'Cộc lốc · người đối diện sẽ nhắc nhở'}]};
}
export type StoryAction={type:'choice';resident:ResidentId;choice:string}|{type:'task';mission:string;step:number};
export function storyAction(state:GameState,action:StoryAction,position:Position):GameState {
  if(state.phase==='open')return {...state,notice:'Hoàn tất ca ở tiệm rồi hãy giúp việc trong xóm.'};
  const stories=state.city.stories;
  const commit=(next:NeighborhoodStories,message:string,patch:Partial<GameState>={},minutes=0,energy=0,goodwill=0):GameState=>({...state,...patch,city:{...state.city,minutes:Math.min(1260,state.city.minutes+minutes),energy:Math.max(0,state.city.energy-energy),goodwill:state.city.goodwill+goodwill,stories:next,life:{...state.city.life,today:{...state.city.life.today,helped:state.city.life.today.helped+next.missions.filter(m=>m.status==='complete').length-stories.missions.filter(m=>m.status==='complete').length}},journal:[`Ngày ${state.day} · ${message}`,...state.city.journal].slice(0,24)},notice:message});
  if(action.type==='choice') {
    const npc=RESIDENTS.find(r=>r.id===action.resident);if(!npc)return state;
    if(!nearCityPlace(position,npc.place))return {...state,notice:`Đến gần ${npc.name} để trò chuyện.`};
    const choice=dialogueNode(stories,npc.id).choices.find(c=>c.id===action.choice);if(!choice)return state;
    const choices=[...stories.choices,`${npc.id}:${stories.nodes[npc.id]??'hello'}:${choice.id}`].slice(-100);
    if(choice.tone){
      const old=stories.tones[npc.id],score=(tone:ConversationTone|undefined)=>tone==='warm'?2:tone==='playful'?1:tone==='brusque'?-1:0;
      if(old===choice.tone)return {...state,notice:PERSONALITIES[npc.id][choice.tone]};
      return commit({...stories,choices,tones:{...stories.tones,[npc.id]:choice.tone},bonds:{...stories.bonds,[npc.id]:Math.max(0,(stories.bonds[npc.id]??0)+score(choice.tone)-score(old))}},`${npc.name}: ${PERSONALITIES[npc.id][choice.tone]}`);
    }
    if(choice.claim) {
      const m=missionFor(stories,npc.id);if(!m||m.status!=='ready')return state;
      const d=missionDefinition(m.id),kind=choice.claim==='kind';
      const cash=kind?0:d.cash;
      const inventory={...state.inventory},freshness={...state.freshness};
      if(d.gift){const {key,count}=d.gift;freshness[key]=(inventory[key]*freshness[key]+count*100)/(inventory[key]+count);inventory[key]+=count;}
      return commit({...stories,choices,missions:stories.missions.map(t=>t.id===m.id?{...t,status:'complete',outcome:choice.claim}:t),bonds:{...stories.bonds,[npc.id]:(stories.bonds[npc.id]??0)+(kind?5:3)}},`Hoàn tất “${d.title}”. ${kind?'Bạn gửi lại tiền công, hàng xóm thêm quý mến.':`Nhận ${cash.toLocaleString('vi-VN')} ₫ tiền công.`}`,{cash:state.cash+cash,fans:state.fans+d.fans+(kind?2:0),researchPoints:state.researchPoints+1,inventory,freshness,customerBond:{...state.customerBond,[npc.customerId]:(state.customerBond[npc.customerId]??0)+(kind?3:2)}},2,0,d.goodwill+(kind?3:0));
    }
    if(choice.mission) {
      if(stories.missions.filter(m=>m.status!=='complete').length>=3)return {...state,notice:'Bạn đang nhận 3 việc. Hoàn tất một việc rồi nhận thêm nhé.'};
      const d=MISSIONS.find(m=>m.id===choice.mission&&m.resident===npc.id);if(!d)return state;
      const previous=missionFor(stories,npc.id);
      if(previous&&(previous.status!=='complete'||(d.episode??1)!==(missionDefinition(previous.id).episode??1)+1))return state;
      if(!previous&&(d.episode??1)!==1)return state;
      return commit({...stories,choices,missions:[...stories.missions,{id:d.id,step:0,status:'active'}]},`Đã nhận việc: ${d.title}. ${d.steps[0].title}.`,{},2);
    }
    if(choice.next&&!Object.hasOwn(SCRIPTS[npc.id],choice.next))return state;
    return commit({...stories,choices,nodes:{...stories.nodes,[npc.id]:choice.next??'hello'}},`${npc.name}: ${SCRIPTS[npc.id][choice.next??'hello'].text}`);
  }
  const m=stories.missions.find(m=>m.id===action.mission);
  if(!m||m.status!=='active'||m.step!==action.step)return state;
  const d=missionDefinition(m.id),step=d.steps[m.step];
  if(!nearCityPlace(position,step.place))return {...state,notice:`Đến ${CITY_PLACES[step.place].name} để ${step.verb.toLowerCase()}.`};
  const hours=CITY_PLACES[step.place].hours;
  if(state.city.minutes<hours[0]||state.city.minutes+step.minutes>hours[1])return {...state,notice:'Không còn đủ giờ làm việc ở đây. Nhiệm vụ được giữ lại cho ngày mai.'};
  if(state.city.energy<step.energy)return {...state,notice:'Bạn cần nghỉ ở hồ để hồi sức trước khi làm việc.'};
  const ready=m.step+1>=d.steps.length;
  return commit({...stories,missions:stories.missions.map(t=>t.id===m.id?{...t,step:t.step+1,status:ready?'ready':'active'}:t)},`${step.verb} xong. ${ready?`Quay lại gặp ${resident(d.resident).name} để báo tin.`:d.steps[m.step+1].title+'.'}`,{},step.minutes,step.energy);
}
