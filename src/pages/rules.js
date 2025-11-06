'use client';
import React from "react";
import styles from "../styles/rules.module.css";
import Net from "../components/Net";

export default function Rules() {
  const rules = [
    { rule: "Ntibyemewe gutangaza inkuru zibiba urwango cyangwa amacakubiri.", penalty: "Kwirukanwa burundu ku rubuga no gusiba ibihangano byose byawe." },
    { rule: "Kirazira gukoresha inkuru y'abandi cyangwa gukora inkuru ku muntu runaka ntaburenganzira bwanyirayo.", penalty: "Kubuzwa gutanga inkuru mu byumweru bibiri no guhagarika konti yawe kugeza ubwo ikibazo gikemutse." },
    { rule: "Kirazira kwandika cyangwa gushishikariza abasomyi ubusambanyi ukoresheje inkuru cyangwa comments.", penalty: "Gusibwa kw'iyo nkuru no gucibwa mande ya NeS 50." },
    { rule: "Abasomyi bagomba kwishyura kugira ngo babashe gusoma inkuru.", penalty: "Kubuzwa kugera ku nkuru." },
    { rule: "Ntibyemewe kwiba ibitekerezo by’undi mwanditsi.", penalty: "Gukurwaho inkuru no guhagarikwa ukwezi kumwe." },
    { rule: "Kwibasira abandi banyamuryango ntibyemewe.", penalty: "Guhagarikwa amezi abiri." },
    { rule: "Kwica uburenganzira bw’umwanditsi ntibyemewe.", penalty: "Gukurwaho inkuru no kwihanangirizwa." },
    { rule: "Abanditsi bagomba gukurikiza ibisabwa mu gushyiraho inkuru.", penalty: "Kubuzwa gutanga inkuru iminsi 10 no gucibwa mande ya NeS 5." },
    { rule: "Gutanga amakuru y’ibihuha ntibyemewe.", penalty: "Kubuzwa gutanga inkuru ukwezi kumwe no gukatwa NeS 45." },
    { rule: "Birabujijwe kwibasira cyangwa kuvuga nabi umusomyi witwaje ko nawe yakubwiye nabi.", penalty: "Guhagarikwa amezi atatu no gucibwa mande ya NeS 25 zihabwa umusomyi nk’imoza marira." },
    { rule: "Gukoresha imvugo itari nyayo ntibyemewe.", penalty: "Gukosorwa inkuru cyangwa guhagarikwa iminsi 15 no gutanga mande ya NeS 10." },
    { rule: "Gusaba abantu kwishyura mu buryo butemewe ubizeza ko bazabona NeS point.", penalty: "Guhagarikwa amezi atandatu cyangwa ukwezi kose utabona inyungu." },
    { rule: "Gutanga ibitekerezo by'ubugome cyangwa by'urwango ntibyemewe.", penalty: "Kwirukanwa burundu." },
    { rule: "Inkuru zose zigomba kuba zifite umwimerere, zuzuye kandi zisobanutse.", penalty: "Gusibwa kw’iyo nkuru no kubuzwa kongera kwandika ukwezi." },
    { rule: "Kugirira nabi abandi banyamuryango ntibyemewe.", penalty: "Guhagarikwa burundu." },
    { rule: "Gutanga inkuru zifite amashusho mabi cyangwa amafoto y’ubusambanyi ntibyemewe.", penalty: "Guhagarikwa imyaka ibiri cyangwa gutanga mande ya NeS 170." },
    { rule: "Gutanga amakuru y'ibihuha nka ‘itangazo’ utabisabiye uburenganzira ntibyemewe.", penalty: "Guhagarikwa amezi 4 no gucibwa mande ya NeS 300." },
    { rule: "Kwica uburenganzira bwa copyright ntibyemewe.", penalty: "Gukurwaho inkuru no kwihanangirizwa." },
    { rule: "Gutanga inkuru zidasobanutse cyangwa zidafite icyerekezo ntibyemewe.", penalty: "Gusibwa kw’iyo nkuru no guhagarikwa iminsi 30." },
    { rule: "Guhakana amategeko y’urubuga ntibyemewe.", penalty: "Kwirukanwa burundu." },
    { rule: "Birabujijwe gushyiraho link iyobora abasomyi ahandi utabisabiye uburenganzira.", penalty: "Kwishyura NeS 200 nk’igiciro cyo kwamamaza." },
    { rule: "Ntamwanditsi ubujijwe kwamamaza mu bihangano bye ariko agomba kubisabira uburenganzira.", penalty: "Iyo atabyubahirije, iyo nkuru irasibwa." },
    { rule: "Buri mwanditsi yemerewe gutangaza ibice 1 cyangwa 2 ku munsi gusa.", penalty: "Gucibwa mande ya NeS 15 kuri buri nkuru yarenzeho." },
    { rule: "Gutinda gutanga inkuru bikabije ntibyemewe.", penalty: "Gusibwa kwa folder y’iyo nkuru no gutanga mande ya NeS 10." },
    { rule: "Aya mategeko agomba kubahirizwa kuva taliki 1/09/2025.", penalty: "Inkuru zatanzwe mbere ntizirebwa n’aya mategeko." }
  ];

  return (
    <div>
      <Net />
      <div className={styles.container}>
        <h1 className={styles.title}>Amategeko ya New Talents Stories Group</h1>
        <div className={styles.rulesList}>
          {rules.map((item, index) => (
            <div key={index} className={styles.rule}>
              <strong>{index + 1}. {item.rule}</strong><br />
              <span className={styles.penalty}>Igihano: {item.penalty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
