// ================= BANKS =================
import bri from "./accounts/banks/bri.png";
import bni from "./accounts/banks/bni.png";
import bca from "./accounts/banks/bca.png";
import mandiri from "./accounts/banks/mandiri.png";
import btn from "./accounts/banks/btn.png";
import cimb from "./accounts/banks/cimb.png";
import danamon from "./accounts/banks/danamon.png";
import maybank from "./accounts/banks/maybank.png";
import ocbc from "./accounts/banks/ocbc.png";
import panin from "./accounts/banks/paninbank.png";
import permata from "./accounts/banks/permatabank.png";
import bsi from "./accounts/banks/bsi.png";

// ================= DEBIT CARD PROVIDERS =================
import visa from "./accounts/banks/debit/visa.png";
import mastercard from "./accounts/banks/debit/mastercard.png";
import gpn from "./accounts/banks/debit/gpn.png";
import jcb from "./accounts/banks/debit/jcb.png";
import prima from "./accounts/banks/debit/prima.png";
import unionpay from "./accounts/banks/debit/unionpay.png";

// ================= DIGITAL BANKS =================
import jago from "./accounts/digitalbank/jago.png";
import seabank from "./accounts/digitalbank/seabank.png";
import jenius from "./accounts/digitalbank/jenius.png";
import blu from "./accounts/digitalbank/blu.png";
import linebank from "./accounts/digitalbank/linebank.png";
import neocommerce from "./accounts/digitalbank/bankneocommerce.png";
import allobank from "./accounts/digitalbank/allobank.png";

// ================= E-WALLETS =================
import ovo from "./accounts/e-wallets/ovo.png";
import gopay from "./accounts/e-wallets/gopay.png";
import dana from "./accounts/e-wallets/dana.png";
import shopeepay from "./accounts/e-wallets/shopeepay.png";
import linkaja from "./accounts/e-wallets/linkaja.png";
import doku from "./accounts/e-wallets/doku.png";
import astrapay from "./accounts/e-wallets/astrapay.png";
import paypal from "./accounts/e-wallets/paypal.png";
import isaku from "./accounts/e-wallets/isaku.png";

// ================= CASH =================
import cash from "./accounts/cash/cash.png";

// ================= LOANS =================
import loans from "./accounts/loans/loans.jpg";

// ================= ASSETS =================
import laptop from "./assets/gadgets/laptop.jpg";
import tablet from "./assets/gadgets/tablet.png";
import smartphone from "./assets/gadgets/smartphone.png";
import smartwatch from "./assets/gadgets/smartwatch.png";

import car from "./assets/vehicles/car.jpg";
import motorcycle from "./assets/vehicles/motorcycle.jpg";
import bicycle from "./assets/vehicles/bicycle.png";

import house from "./assets/properties/house.png";
import apartment from "./assets/properties/apartment.png";
import retailbuilding from "./assets/properties/retailbuilding.png";

import landplot from "./assets/lands/landplot.jpg";
import farmfield from "./assets/lands/farmfield.png";

import goldbar from "./assets/golds/goldbar.png";
import goldjewelry from "./assets/golds/goldjewelry.png";

// ================= CREATORS =================
import youtube from "./creators/youtube.png";
import tiktok from "./creators/tiktok.png";
import instagram from "./creators/instagram.png";
import facebook from "./creators/facebook.png";
import fiverr from "./creators/fiverr.png";
import upwork from "./creators/upwork.png";
import shopee from "./creators/shopee.png";
import lynkid from "./creators/lynkid.png";
import blogger from "./creators/blogger.jpg";
import x from "./creators/x.jpg";

// ================= LOGO MAP =================
export const logoMap = {
  // ===== ACCOUNTS =====
  bank: {
    bri: bri,
    bni: bni,
    bca: bca,
    mandiri: mandiri,
    btn: btn,
    bsi: bsi,

    cimb: cimb,
    cimbniaga: cimb,
    bankcimbniaga: cimb,

    danamon: danamon,
    maybank: maybank,
    ocbc: ocbc,
    panin: panin,
    permata: permata,

    default: bca,
  },

  // ===== DEBIT CARD PROVIDERS =====
  debit: {
    visa: visa,
    mastercard: mastercard,
    gpn: gpn,
    jcb: jcb,
    prima: prima,
    unionpay: unionpay,
    default: gpn,
  },

  digitalbank: {
    jago: jago,
    bankjago: jago,

    seabank: seabank,
    bankseabank: seabank,

    jenius: jenius,
    blu: blu,
    linebank: linebank,
    neocommerce: neocommerce,
    bankneocommerce: neocommerce,
    allobank: allobank,

    default: jago,
  },

  // alias aman kalau ada data lama
  "digital bank": {
    jago: jago,
    seabank: seabank,
    jenius: jenius,
    blu: blu,
    linebank: linebank,
    neocommerce: neocommerce,
    allobank: allobank,
    default: jago,
  },

  ewallet: {
    ovo: ovo,
    gopay: gopay,
    dana: dana,
    shopeepay: shopeepay,
    linkaja: linkaja,
    doku: doku,
    astrapay: astrapay,
    paypal: paypal,
    isaku: isaku,

    default: ovo,
  },

  cash: {
    cash: cash,
    wallet: cash,
    default: cash,
  },

  loan: {
    loan: loans,
    loans: loans,
    piutang: loans,
    receivable: loans,
    default: loans,
  },

  // ===== ASSETS =====
  property: {
    house: house,
    apartment: apartment,
    retailbuilding: retailbuilding,
  },

  vehicle: {
    car: car,
    motorcycle: motorcycle,
    bycicle: bicycle,
  },

  gadget: {
    laptop: laptop,
    tablet: tablet,
    smartphone: smartphone,
    smartwatch: smartwatch,
  },

  land: {
    landplot: landplot,
    farmfield: farmfield,
  },

  gold: {
    goldbar: goldbar,
    goldjewelry: goldjewelry,
  },

  // ===== CREATORS (LENGKAP) =====
  creators: {
    youtube: youtube,
    tiktok: tiktok,
    instagram: instagram,

    twitter: x,
    x: x,

    facebook: facebook,
    blogger: blogger,
    blog: blogger,

    fiverr: fiverr,
    upwork: upwork,
    shopee: shopee,
    lynkid: lynkid,
  },

  // ===== FALLBACK =====
  other: {
    default: cash,
  },
};