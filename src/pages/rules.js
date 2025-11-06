'use client';
import React from "react";
import styles from "../styles/rules.module.css";
import Net from "../components/Net";

export default function Rules() {
  const rules = [
    { rule: "Ntibyemewe gutangaza inkuru zibiba urwango cyangwa amacakubiri.", penalty: "Kwirukanwa burundu ku rubuga no gusiba ibihangano byose byawe." },
    { rule: "Kirazira gukoresha inkuru y'abandi cyangwa gukora inkuru ku muntu runaka ntaburenganzira bwanyirayo.", penalty: "Kubuzwa gutanga inkuru mu byumweru bibiri no guhagarika konti yawe kugeza ikibazo gikemutse." },
    { rule: "Kirazira kwandika cyangwa gushishikariza abasomyi ubusambanyi ukoresheje inkuru cyangwa comments.", penalty: "Gusibwa kw’iyo nkuru, no gucibwa mande ya Nes 50." },
    { rule: "Abasomyi bagomba kwishyura kugira ngo babashe gusoma inkuru.", penalty: "Kubuzwa kugera ku nkuru." },
    { rule: "Ntibyemewe kwiba ibitekerezo by’undi mwanditsi.", penalty: "Gukurwaho inkuru no guhagarikwa ukwezi kumwe." },
    { rule: "Kwibasira abandi banyamuryango ntibyemewe.", penalty: "Guhagarikwa amezi abiri." },
    { rule: "Kwica uburenganzira bw’umwanditsi ntibyemewe.", penalty: "Gukurwaho inkuru no kwihanangirizwa." },
    { rule: "Abanditsi bagomba gukurikiza ibisabwa mu gushyiraho inkuru.", penalty: "Kubuzwa gutanga inkuru iminsi 10 igihe atabyubahirije, no gutanga mande ya Nes 5." },
    { rule: "Gutanga amakuru y’ibihuha ntibyemewe.", penalty: "Kubuzwa gutanga inkuru ukwezi kumwe, no gukatwa Nes 45." },
    { rule: "Birabujijwe kwibasira cyangwa kuvuga nabi umusomyi witwaje ko nawe yakubwiye nabi.", penalty: "Guhagarikwa amezi atatu, no gucibwa mande ya Nes 25 zihabwa umusomyi nk’imoza marira." },
    { rule: "Gukoresha imvugo itari nyayo ntibyemewe.", penalty: "Gukosorwa inkuru cyangwa guhagarikwa iminsi 15 no gutanga mande ya Nes 10." },
    { rule: "Gusaba abantu kwishyura mu buryo butemewe ntibyemewe.", penalty: "Guhagarikwa amezi atandatu cyangwa gutanga inkuru utabona inyungu zayo ukwezi kose." },
    { rule: "Gutanga ibitekerezo by'ubugome cyangwa by'urwango ntibyemewe.", penalty: "Kwirukanwa burundu." },
    { rule: "Inkuru zose zigomba kuba zifite umwimerere, zifite ifoto, umutwe wanditse neza, n’amagambo asobanutse.", penalty: "Gusibwa kw’iyo nkuru no kubuzwa kongera kwandika ukwezi." },
    { rule: "Kugirira nabi abandi banyamuryango ntibyemewe.", penalty: "Guhagarikwa burundu." },
    { rule: "Gutanga inkuru zifite amashusho mabi cyangwa amafoto y’ubusambanyi ntibyemewe.", penalty: "Guhagarikwa imyaka ibiri, cyangwa gutanga mande ya Nes 170." },
    { rule: "Gutanga inkuru zirimo amakuru y'ibihuha ntibyemewe.", penalty: "Guhagarikwa amezi 4, na mande ya Nes 300." },
    { rule: "Kwica uburenganzira bwa copyright ntibyemewe.", penalty: "Gukurwaho inkuru no kwihanangirizwa." },
    { rule: "Gutanga inkuru zidasobanutse, zidafite icyerecyezo ntibyemewe.", penalty: "Gukosorwa inkuru cyangwa guhagarikwa iminsi 30 no gusibwa kw’iyo nkuru." },
    { rule: "Guhakana amategeko y’urubuga ntibyemewe.", penalty: "Kwirukanwa burundu." },
    { rule: "Birabujijwe gutanga inkuru irimo kwamamaza urubuga rutari New TalentsG.", penalty: "Gusibwa kw’iyo nkuru no gucibwa mande ya Nes 100." },
    { rule: "Mugihe usabwe gukosora inkuru yawe utegetswe kubyubahiriza bitarenze amasaha 24.", penalty: "Gusibwa kw’iyo nkuru no gutanga mande ya Nes 30." },
    { rule: "Birabujijwe gushyira link iyobora abasomyi ahandi.", penalty: "Kwishyura Nes 200 nk’igiciro cyo kwamamaza." },
    { rule: "Umwanditsi yemerewe kwamamaza mu bihangano bye aruko yabisabiye uburenganzira.", penalty: "Iyo atabyubahirije, iyo nkuru irasibwa." },
    { rule: "Buri mwanditsi yemerewe gutangaza inkuru 1 cyangwa 2 ku munsi gusa.", penalty: "Gucibwa mande ya Nes 15 kuri buri nkuru yarenzeho." },
    { rule: "Gutinda gutanga inkuru bikabije ntibyemewe.", penalty: "Gusibwa kwa folder y’iyo nkuru no gutanga mande ya Nes 10." },
    { rule: "Aya mategeko agomba kubahirizwa kuva taliki 1/09/2025.", penalty: "Inkuru zatanzwe mbere ntizirebwa n’aya mategeko." }
  ];

  return (
    <div>
      <Net />
      <div className={styles.container}>
        <h1>📜 Amategeko ya <span>New Talents Stories Group</span></h1>
        <div className={styles.rulesList}>
          {rules.map((item, index) => (
            <div key={index} className={styles.ruleCard}>
              <h3>{index + 1}. {item.rule}</h3>
              <p className={styles.penalty}>Igihano: {item.penalty}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
