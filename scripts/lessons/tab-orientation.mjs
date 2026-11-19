import ar from './locales/ar.mjs';
import bn from './locales/bn.mjs';
import ru from './locales/ru.mjs';
import {escape as e} from '../pages/components.mjs';
import {tunings} from './tablature.mjs';

// One drawing and one note sequence are shared by all three views.
export const orientationCopy={
 ar: ar.orientation,
 bn: bn.orientation,
 ru: ru.orientation,

 en:{title:'From the neck to the tab',intro:'Follow string 1 through the three views. The instrument stays the same; only the drawing turns.',steps:['Look at the neck','Turn the view 90°','Read the tab'],captions:['The nut is at the top. String 1 is on the right.','Turn the drawing to the left: string 1 is now on top, with the nut on the left.','The top line is string 1. Read 0, 2, 3 from left to right: open string, fret 2, fret 3.'],key:'Cyan: string 1. Pink: the last string. The numbers are frets, not fingers. Only the numbered string is played.'},
 fr:{title:'Du manche à la tablature',intro:'Suis la corde 1 dans les trois vues. L’instrument reste le même : seul le dessin tourne.',steps:['Observe le manche','Tourne la vue de 90°','Lis la tablature'],captions:['Le sillet est en haut. La corde 1 est à droite.','Tourne le dessin vers la gauche : la corde 1 passe en haut et le sillet à gauche.','La ligne du haut est la corde 1. Lis 0, 2, 3 de gauche à droite : corde à vide, case 2, case 3.'],key:'Cyan : corde 1. Rose : dernière corde. Les chiffres sont les cases, pas les doigts. Seule la corde portant les chiffres se joue.'},
 es:{title:'Del mástil a la tablatura',intro:'Sigue la cuerda 1 en las tres vistas. El instrumento no cambia; solo gira el dibujo.',steps:['Mira el mástil','Gira la vista 90°','Lee la tablatura'],captions:['La cejuela está arriba. La cuerda 1 está a la derecha.','Gira el dibujo hacia la izquierda: la cuerda 1 queda arriba y la cejuela a la izquierda.','La línea superior es la cuerda 1. Lee 0, 2, 3 de izquierda a derecha: cuerda al aire, traste 2, traste 3.'],key:'Cian: cuerda 1. Rosa: última cuerda. Los números son trastes, no dedos. Solo se toca la cuerda con números.'},
 de:{title:'Vom Griffbrett zur Tabulatur',intro:'Verfolge Saite 1 in den drei Ansichten. Das Instrument bleibt gleich; nur die Zeichnung dreht sich.',steps:['Betrachte den Hals','Drehe die Ansicht um 90°','Lies die Tabulatur'],captions:['Der Sattel ist oben. Saite 1 ist rechts.','Drehe die Zeichnung nach links: Saite 1 ist jetzt oben, der Sattel links.','Die oberste Linie ist Saite 1. Lies 0, 2, 3 von links nach rechts: leere Saite, Bund 2, Bund 3.'],key:'Cyan: Saite 1. Rosa: letzte Saite. Die Zahlen bezeichnen Bünde, keine Finger. Spiele nur die Saite mit Zahlen.'},
 it:{title:'Dal manico alla tablatura',intro:'Segui la corda 1 nelle tre viste. Lo strumento resta lo stesso; ruota solo il disegno.',steps:['Osserva il manico','Ruota la vista di 90°','Leggi la tablatura'],captions:['Il capotasto è in alto. La corda 1 è a destra.','Ruota il disegno verso sinistra: la corda 1 è ora in alto e il capotasto a sinistra.','La linea superiore è la corda 1. Leggi 0, 2, 3 da sinistra a destra: corda a vuoto, tasto 2, tasto 3.'],key:'Ciano: corda 1. Rosa: ultima corda. I numeri indicano i tasti, non le dita. Suona solo la corda con i numeri.'},
 'pt-BR':{title:'Do braço à tablatura',intro:'Siga a corda 1 nas três vistas. O instrumento é o mesmo; só o desenho gira.',steps:['Observe o braço','Gire a vista 90°','Leia a tablatura'],captions:['A pestana está em cima. A corda 1 está à direita.','Gire o desenho para a esquerda: a corda 1 fica em cima e a pestana à esquerda.','A linha de cima é a corda 1. Leia 0, 2, 3 da esquerda para a direita: corda solta, casa 2, casa 3.'],key:'Ciano: corda 1. Rosa: última corda. Os números indicam casas, não dedos. Toque apenas a corda com números.'},
 hi:{title:'गर्दन से टैब तक',intro:'तीनों चित्रों में तार 1 को देखें। वाद्य वही है; सिर्फ चित्र घूमता है।',steps:['गर्दन को सामने से देखें','चित्र को 90° घुमाएँ','टैब पढ़ें'],captions:['नट ऊपर है। तार 1 दाईं ओर है।','चित्र को बाईं ओर घुमाएँ: तार 1 अब ऊपर है और नट बाईं ओर है।','सबसे ऊपर की लाइन तार 1 है। बाएँ से दाएँ 0, 2, 3 पढ़ें: खुला तार, फ़्रेट 2, फ़्रेट 3।'],key:'सायन: तार 1। गुलाबी: आखिरी तार। अंक फ़्रेट हैं, उँगलियाँ नहीं। सिर्फ अंक वाले तार को बजाएँ।'},
 id:{title:'Dari leher ke tablatur',intro:'Ikuti senar 1 dalam ketiga tampilan. Instrumennya tetap sama; hanya gambarnya yang diputar.',steps:['Lihat leher dari depan','Putar tampilan 90°','Baca tablatur'],captions:['Nut berada di atas. Senar 1 berada di kanan.','Putar gambar ke kiri: senar 1 kini di atas dan nut di kiri.','Garis teratas adalah senar 1. Baca 0, 2, 3 dari kiri ke kanan: senar terbuka, fret 2, fret 3.'],key:'Sian: senar 1. Merah muda: senar terakhir. Angka menunjukkan fret, bukan jari. Mainkan hanya senar yang memiliki angka.'},
 ja:{title:'指板からタブ譜へ',intro:'3つの図で1弦を追ってみましょう。楽器は同じで、図だけを回します。',steps:['ネックを正面から見る','図を90°回す','タブ譜を読む'],captions:['ナットが上、1弦が右にあります。','図を左に回すと、1弦が上、ナットが左になります。','一番上の線が1弦です。左から0、2、3と読み、開放弦、2フレット、3フレットを弾きます。'],key:'水色は1弦、ピンクは最後の弦です。数字は指ではなくフレットです。数字がある弦だけを弾きます。'},
 ko:{title:'지판에서 타브로',intro:'세 그림에서 1번 줄을 따라가 보세요. 악기는 그대로이고 그림만 돌아갑니다.',steps:['지판을 정면에서 보기','그림을 90° 돌리기','타브 읽기'],captions:['너트는 위에, 1번 줄은 오른쪽에 있습니다.','그림을 왼쪽으로 돌리면 1번 줄은 위에, 너트는 왼쪽에 놓입니다.','맨 위 선이 1번 줄입니다. 왼쪽부터 0, 2, 3을 읽으세요: 개방현, 2프렛, 3프렛입니다.'],key:'하늘색은 1번 줄, 분홍색은 마지막 줄입니다. 숫자는 손가락이 아닌 프렛입니다. 숫자가 있는 줄만 연주하세요.'},
 'zh-CN':{title:'从指板到指法谱',intro:'在三种视图中查看 1 弦。乐器没有改变，只是图转了方向。',steps:['正面看指板','将图转动 90°','阅读指法谱'],captions:['弦枕在上方，1 弦在右侧。','将图向左转：1 弦来到上方，弦枕来到左侧。','最上方的线是 1 弦。从左到右读 0、2、3：空弦、第 2 品、第 3 品。'],key:'青色是 1 弦，粉色是最后一根弦。数字表示品位，不是手指。只弹有数字的弦。'}
};

const text=(x,y,value,fill='#e8eef7',size=18)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${size}" font-family="Arial,sans-serif" font-weight="700">${e(value)}</text>`;
const color=(index,count)=>index===count-1?'#7ce5fa':index===0?'#ff73c7':'#c5c9d2';

export function renderTabOrientation(instrument,lesson){
 const copy=lesson.orientation,labels=tunings[instrument].labels.map(note=>lesson.notation[note]).reverse(),count=labels.length;
 const xs=labels.map((_,i)=>90+i*120/(count-1));
 const notes=[{fret:0,y:64},{fret:2,y:192},{fret:3,y:262}];
 let neck='<path d="M86 56L76 14Q74 6 88 6H212Q226 6 224 14L214 56Z" fill="#704a36" stroke="#b0885d" stroke-width="2"/>';
 // The same geometry is rotated, so strings and frets cannot be mirrored by mistake.
 neck+='<path d="M84 56H216L222 302H78Z" fill="#322320" stroke="#946b4e" stroke-width="2"/>';
 for(const y of [146,216,286])neck+=`<path d="M80 ${y}H220" stroke="#aeb5c0" stroke-width="3"/>`;
 neck+='<path d="M84 76H216" stroke="#e6ddc8" stroke-width="7"/>';
 for(const [i,x]of xs.entries()){
  const side=i<count/2?68:232;
  neck+=`<rect x="${side-7}" y="${14+(i%(count/2))*13}" width="14" height="8" rx="3" fill="#aeb5c0"/>`;
  neck+=`<path data-string="${count-i}" d="M${x} 24V302" stroke="${color(i,count)}" stroke-width="${1.2+(count-1-i)*.35}"/>`;
 }
 const labelString=(i,x,y)=>text(x,y,labels[i],color(i,count),14)+text(x,y+16,count-i,'#aab9d0',11);
 const rowLabel=(i,x,y)=>text(x,y+6,labels[i],color(i,count),14)+text(x+22,y+4,count-i,'#aab9d0',11);
 const dot=(x,y,fret)=>`<g data-string="1" data-fret="${fret}"><circle cx="${x}" cy="${y}" r="13" fill="#10152c" stroke="#7ce5fa" stroke-width="2"/>${text(x,y+6,fret,'#7ce5fa')}</g>`;
 const front=neck+xs.map((x,i)=>labelString(i,x,328)).join('')+[1,2,3].map(f=>text(48,122+(f-1)*70,f,'#aab9d0',16)).join('')+notes.map(n=>dot(xs.at(-1),n.y,n.fret)).join('');
 const turned=`<g transform="translate(0 300) rotate(-90)">${neck}</g>`+xs.map((x,i)=>rowLabel(i,320,300-x)).join('')+[1,2,3].map(f=>text(111+(f-1)*70,252,f,'#aab9d0',16)).join('')+notes.map(n=>dot(n.y,300-xs.at(-1),n.fret)).join('');
 let tab=xs.map((x,i)=>`<g>${rowLabel(i,20,300-x)}<path data-string="${count-i}" d="M48 ${300-x}H318" stroke="${color(i,count)}" stroke-width="1.8"/></g>`).join('');
 tab+=notes.map((n,i)=>dot(88+i*96,300-xs.at(-1),n.fret)).join('');
 tab+='<path d="M70 252H290m-8-6 8 6-8 6" fill="none" stroke="#aab9d0" stroke-width="2"/>';
 const drawings=[front,turned,tab],boxes=['0 0 300 350','0 0 350 300','0 0 350 300'];
 return `<section class="tab-orientation" aria-labelledby="tab-orientation-title"><h2 id="tab-orientation-title">${e(copy.title)}</h2><p>${e(copy.intro)}</p><div class="orientation-steps">${drawings.map((drawing,i)=>`<figure class="orientation-step"><h3><span>${i+1}</span> ${e(copy.steps[i])}</h3><svg class="orientation-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="${boxes[i]}" role="img" aria-labelledby="orientation-${i}-title orientation-${i}-desc"><title id="orientation-${i}-title">${e(copy.steps[i])}</title><desc id="orientation-${i}-desc">${e(copy.captions[i])}</desc>${drawing}</svg><figcaption>${e(copy.captions[i])}</figcaption></figure>`).join('')}</div><p class="orientation-key">${e(copy.key)}</p></section>`;
}
