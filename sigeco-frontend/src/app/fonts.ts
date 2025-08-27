import {
  Roboto as FontRoboto,
  Montserrat as FontMontserrat,
  Lato as FontLato,
  Poppins as FontPoppins,
  Open_Sans as FontOpen_Sans,
  Oswald as FontOswald,
  Raleway as FontRaleway,
  Merriweather as FontMerriweather,
  Nunito as FontNunito,
  Playfair_Display as FontPlayfair_Display,
  Inter as FontInter,
  Source_Code_Pro as FontSource_Code_Pro,
  Ubuntu as FontUbuntu,
  PT_Sans as FontPT_Sans,
  Lora as FontLora,
  Rubik as FontRubik,
  Work_Sans as FontWork_Sans,
  Fira_Sans as FontFira_Sans,
  Noto_Sans as FontNoto_Sans,
  Titillium_Web as FontTitillium_Web,
  Josefin_Sans as FontJosefin_Sans,
  Arimo as FontArimo,
  Bebas_Neue as FontBebas_Neue,
  Anton as FontAnton,
  Pacifico as FontPacifico,
  Lobster as FontLobster,
  Caveat as FontCaveat,
  Dancing_Script as FontDancing_Script,
  Shadows_Into_Light as FontShadows_Into_Light,
  Righteous as FontRighteous,
  Comfortaa as FontComfortaa,
  Exo_2 as FontExo_2,
  Teko as FontTeko,
  Abel as FontAbel,
  Barlow as FontBarlow,
  Quicksand as FontQuicksand,
  Hind as FontHind,
  Heebo as FontHeebo,
  Karla as FontKarla,
  Inconsolata as FontInconsolata,
  Cormorant_Garamond as FontCormorant_Garamond,
  Yanone_Kaffeesatz as FontYanone_Kaffeesatz,
  Amatic_SC as FontAmatic_SC,
  Zilla_Slab as FontZilla_Slab,
  Asap as FontAsap,
  Crimson_Text as FontCrimson_Text,
  Domine as FontDomine,
  Vollkorn as FontVollkorn,
  Cardo as FontCardo,
  Alegreya as FontAlegreya,
  Old_Standard_TT as FontOld_Standard_TT,
  PT_Serif as FontPT_Serif,
  Bitter as FontBitter,
  Dosis as FontDosis,
  Mulish as FontMulish,
  Signika as FontSignika,
  Archivo as FontArchivo,
  Cabin as FontCabin,
  Overpass as FontOverpass,
  Slabo_27px as FontSlabo_27px,
  Merriweather_Sans as FontMerriweather_Sans,
  Nunito_Sans as FontNunito_Sans,
  Source_Sans_3 as FontSource_Sans_3,
  Prompt as FontPrompt,
  Kanit as FontKanit,
  Mitr as FontMitr,
  Sarabun as FontSarabun,
  Taviraj as FontTaviraj,
  Pridi as FontPridi,
  Chakra_Petch as FontChakra_Petch,
  Krub as FontKrub,
  Bai_Jamjuree as FontBai_Jamjuree,
  Srisakdi as FontSrisakdi,
  Mali as FontMali,
  Niramit as FontNiramit,
  Itim as FontItim,
  Athiti as FontAthiti,
  Trirong as FontTrirong,
  K2D as FontK2D,
  Sriracha as FontSriracha,
  Pattaya as FontPattaya,
  Charm as FontCharm,
  Kodchasan as FontKodchasan,
  KoHo as FontKoHo,
  Thasadith as FontThasadith,
  Fahkwang as FontFahkwang,
  Chonburi as FontChonburi,
  Maitree as FontMaitree,
  Pragati_Narrow as FontPragati_Narrow,
  Rajdhani as FontRajdhani,
  Khand as FontKhand,
  Hind_Siliguri as FontHind_Siliguri,
  Hind_Madurai as FontHind_Madurai,
  Hind_Vadodara as FontHind_Vadodara,
  Lalezar as FontLalezar,
  Katibeh as FontKatibeh,
  Mirza as FontMirza,
  Amiri as FontAmiri,
  Scheherazade_New as FontScheherazade_New
} from 'next/font/google';

// Cada fuente se declara como una constante individual en el ámbito del módulo.
const Roboto = FontRoboto({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-roboto' });
const Montserrat = FontMontserrat({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-montserrat' });
const Lato = FontLato({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-lato' });
const Poppins = FontPoppins({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-poppins' });
const Open_Sans = FontOpen_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-open-sans' });
const Oswald = FontOswald({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-oswald' });
const Raleway = FontRaleway({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-raleway' });
const Merriweather = FontMerriweather({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-merriweather' });
const Nunito = FontNunito({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-nunito' });
const Playfair_Display = FontPlayfair_Display({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-playfair-display' });
const Inter = FontInter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const Source_Code_Pro = FontSource_Code_Pro({ subsets: ['latin'], display: 'swap', variable: '--font-source-code-pro' });
const Ubuntu = FontUbuntu({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-ubuntu' });
const PT_Sans = FontPT_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-pt-sans' });
const Lora = FontLora({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-lora' });
const Rubik = FontRubik({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-rubik' });
const Work_Sans = FontWork_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-work-sans' });
const Fira_Sans = FontFira_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-fira-sans' });
const Noto_Sans = FontNoto_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-noto-sans' });
const Titillium_Web = FontTitillium_Web({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-titillium-web' });
const Josefin_Sans = FontJosefin_Sans({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-josefin-sans' });
const Arimo = FontArimo({ weight: ['400', '700'], subsets: ['latin'], display: 'swap', variable: '--font-arimo' });
const Bebas_Neue = FontBebas_Neue({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-bebas-neue' });
const Anton = FontAnton({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-anton' });
const Pacifico = FontPacifico({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-pacifico' });
const Lobster = FontLobster({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-lobster' });
const Caveat = FontCaveat({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-caveat' });
const Dancing_Script = FontDancing_Script({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-dancing-script' });
const Shadows_Into_Light = FontShadows_Into_Light({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-shadows-into-light' });
const Righteous = FontRighteous({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-righteous' });
const Comfortaa = FontComfortaa({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-comfortaa' });
const Exo_2 = FontExo_2({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-exo-2' });
const Teko = FontTeko({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-teko' });
const Abel = FontAbel({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-abel' });
const Barlow = FontBarlow({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-barlow' });
const Quicksand = FontQuicksand({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-quicksand' });
const Hind = FontHind({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-hind' });
const Heebo = FontHeebo({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-heebo' });
const Karla = FontKarla({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-karla' });
const Inconsolata = FontInconsolata({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-inconsolata' });
const Cormorant_Garamond = FontCormorant_Garamond({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-cormorant-garamond' });
const Yanone_Kaffeesatz = FontYanone_Kaffeesatz({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-yanone-kaffeesatz' });
const Amatic_SC = FontAmatic_SC({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-amatic-sc' });
const Zilla_Slab = FontZilla_Slab({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-zilla-slab' });
const Asap = FontAsap({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-asap' });
const Crimson_Text = FontCrimson_Text({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-crimson-text' });
const Domine = FontDomine({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-domine' });
const Vollkorn = FontVollkorn({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-vollkorn' });
const Cardo = FontCardo({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-cardo' });
const Alegreya = FontAlegreya({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-alegreya' });
const Old_Standard_TT = FontOld_Standard_TT({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-old-standard-tt' });
const PT_Serif = FontPT_Serif({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-pt-serif' });
const Bitter = FontBitter({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-bitter' });
const Dosis = FontDosis({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-dosis' });
const Mulish = FontMulish({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-mulish' });
const Signika = FontSignika({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-signika' });
const Archivo = FontArchivo({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-archivo' });
const Cabin = FontCabin({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-cabin' });
const Overpass = FontOverpass({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-overpass' });
const Slabo_27px = FontSlabo_27px({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-slabo-27px' });
const Merriweather_Sans = FontMerriweather_Sans({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-merriweather-sans' });
const Nunito_Sans = FontNunito_Sans({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-nunito-sans' });
const Source_Sans_3 = FontSource_Sans_3({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-source-sans-3' });
const Prompt = FontPrompt({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-prompt' });
const Kanit = FontKanit({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-kanit' });
const Mitr = FontMitr({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-mitr' });
const Sarabun = FontSarabun({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-sarabun' });
const Taviraj = FontTaviraj({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-taviraj' });
const Pridi = FontPridi({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-pridi' });
const Chakra_Petch = FontChakra_Petch({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-chakra-petch' });
const Krub = FontKrub({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-krub' });
const Bai_Jamjuree = FontBai_Jamjuree({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-bai-jamjuree' });
const Srisakdi = FontSrisakdi({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-srisakdi' });
const Mali = FontMali({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-mali' });
const Niramit = FontNiramit({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-niramit' });
const Itim = FontItim({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-itim' });
const Athiti = FontAthiti({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-athiti' });
const Trirong = FontTrirong({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-trirong' });
const K2D = FontK2D({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-k2d' });
const Sriracha = FontSriracha({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-sriracha' });
const Pattaya = FontPattaya({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-pattaya' });
const Charm = FontCharm({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-charm' });
const Kodchasan = FontKodchasan({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-kodchasan' });
const KoHo = FontKoHo({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-koho' });
const Thasadith = FontThasadith({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-thasadith' });
const Fahkwang = FontFahkwang({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-fahkwang' });
const Chonburi = FontChonburi({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-chonburi' });
const Maitree = FontMaitree({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-maitree' });
const Pragati_Narrow = FontPragati_Narrow({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-pragati-narrow' });
const Rajdhani = FontRajdhani({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-rajdhani' });
const Khand = FontKhand({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-khand' });
const Hind_Siliguri = FontHind_Siliguri({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-hind-siliguri' });
const Hind_Madurai = FontHind_Madurai({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-hind-madurai' });
const Hind_Vadodara = FontHind_Vadodara({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-hind-vadodara' });
const Lalezar = FontLalezar({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-lalezar' });
const Katibeh = FontKatibeh({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-katibeh' });
const Mirza = FontMirza({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-mirza' });
const Amiri = FontAmiri({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-amiri' });
const Scheherazade_New = FontScheherazade_New({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-scheherazade-new' });

// Agrupamos las fuentes de Google en un objeto para fácil acceso
export const fonts = {
  Roboto, Montserrat, Lato, Poppins, Open_Sans, Oswald, Raleway, Merriweather, Nunito, Playfair_Display, Inter, Source_Code_Pro, Ubuntu, PT_Sans, Lora, Rubik, Work_Sans, Fira_Sans, Noto_Sans, Titillium_Web, Josefin_Sans, Arimo, Bebas_Neue, Anton, Pacifico, Lobster, Caveat, Dancing_Script, Shadows_Into_Light, Righteous, Comfortaa, Exo_2, Teko, Abel, Barlow, Quicksand, Hind, Heebo, Karla, Inconsolata, Cormorant_Garamond, Yanone_Kaffeesatz, Amatic_SC, Zilla_Slab, Asap, Crimson_Text, Domine, Vollkorn, Cardo, Alegreya, Old_Standard_TT, PT_Serif, Bitter, Dosis, Mulish, Signika, Archivo, Cabin, Overpass, Slabo_27px, Merriweather_Sans, Nunito_Sans, Source_Sans_3, Prompt, Kanit, Mitr, Sarabun, Taviraj, Pridi, Chakra_Petch, Krub, Bai_Jamjuree, Srisakdi, Mali, Niramit, Itim, Athiti, Trirong, K2D, Sriracha, Pattaya, Charm, Kodchasan, KoHo, Thasadith, Fahkwang, Chonburi, Maitree, Pragati_Narrow, Rajdhani, Khand, Hind_Siliguri, Hind_Madurai, Hind_Vadodara, Lalezar, Katibeh, Mirza, Amiri, Scheherazade_New
};

// --- INICIO DE LA MODIFICACIÓN ---
// Añadimos una lista de fuentes clásicas del sistema
export const systemFonts = [
    { name: 'Arial', family: 'Arial, Helvetica, sans-serif' },
    { name: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
    { name: 'Tahoma', family: 'Tahoma, Geneva, sans-serif' },
    { name: 'Trebuchet MS', family: "'Trebuchet MS', Helvetica, sans-serif" },
    { name: 'Times New Roman', family: "'Times New Roman', Times, serif" },
    { name: 'Georgia', family: 'Georgia, serif' },
    { name: 'Garamond', family: 'Garamond, serif' },
    { name: 'Courier New', family: "'Courier New', Courier, monospace" },
    { name: 'Brush Script MT', family: "'Brush Script MT', cursive" },
];

// Unimos ambas listas para el selector
export const fontList = [
    ...Object.keys(fonts),
    ...systemFonts.map(f => f.name)
];
// --- FIN DE LA MODIFICACIÓN ---