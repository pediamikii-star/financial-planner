// src/assets/logos/logoMap.js

// ================= BANKS =================
import BRI from "./accounts/banks/BRI.png";
import BNI from "./accounts/banks/BNI.png";
import BCA from "./accounts/banks/BCA.png";
import Mandiri from "./accounts/banks/Mandiri.png";
import BTN from "./accounts/banks/BTN.png";
import CIMB from "./accounts/banks/CIMB.png";
import Danamon from "./accounts/banks/Danamon.png";
import Maybank from "./accounts/banks/MayBank.png";
import OCBC from "./accounts/banks/OCBC.png";
import Panin from "./accounts/banks/PaninBank.png";
import Permata from "./accounts/banks/PermataBank.png";
import BSI from "./accounts/banks/BSI.png"; // TAMBAH BSI DISINI

// ================= DEBIT CARD PROVIDERS =================
import Visa from "./accounts/banks/debit/Visa.png";
import Mastercard from "./accounts/banks/debit/Mastercard.png";
import GPN from "./accounts/banks/debit/GPN.png";
import JCB from "./accounts/banks/debit/JCB.png";
import Prima from "./accounts/banks/debit/Prima.png";
import UnionPay from "./accounts/banks/debit/UnionPay.png";

// ================= DIGITAL BANKS =================
import Jago from "./accounts/digitalbank/Jago.png";
import SeaBank from "./accounts/digitalbank/SeaBank.png";
import Jenius from "./accounts/digitalbank/Jenius.png";
import Blu from "./accounts/digitalbank/Blu.png";
import LineBank from "./accounts/digitalbank/LineBank.png";
import NeoCommerce from "./accounts/digitalbank/BankNeoCommerce.png";
import AlloBank from "./accounts/digitalbank/AlloBank.png";

// ================= E-WALLETS =================
import OVO from "./accounts/e-wallets/OVO.png";
import Gopay from "./accounts/e-wallets/Gopay.png";
import Dana from "./accounts/e-wallets/Dana.png";
import Shopeepay from "./accounts/e-wallets/Shopeepay.png";
import LinkAja from "./accounts/e-wallets/LinkAja.png";
import DOKU from "./accounts/e-wallets/DOKU.png";
import AstraPay from "./accounts/e-wallets/AstraPay.png";
import PayPal from "./accounts/e-wallets/PayPal.png";
import iSaku from "./accounts/e-wallets/iSaku.png";

// ================= CASH =================
import Cash from "./accounts/cash/Cash.png";

// ================= LOANS =================
import Loans from "./accounts/loans/loans.jpg";

// ================= ASSETS =================
import Laptop from "./assets/gadgets/Laptop.jpg";
import Tablet from "./assets/gadgets/Tablet.png";
import Smartphone from "./assets/gadgets/Smartphone.png";
import Smartwatch from "./assets/gadgets/Smartwatch.png";

import Car from "./assets/vehicles/Car.jpg";
import Motorcycle from "./assets/vehicles/Motorcycle.jpg";
import Bicycle from "./assets/vehicles/Bicycle.png";

import House from "./assets/properties/House.png";
import Apartment from "./assets/properties/Apartment.png";
import RetailBuilding from "./assets/properties/RetailBuilding.png";

import LandPlot from "./assets/lands/LandPlot.jpg";
import FarmField from "./assets/lands/FarmField.png";

import GoldBar from "./assets/golds/GoldBar.png";
import GoldJewelry from "./assets/golds/GoldJewelry.png";

// ================= CREATORS =================
import Youtube from "./creators/Youtube.png";
import Tiktok from "./creators/Tiktok.png";
import Instagram from "./creators/Instagram.png";
import Facebook from "./creators/Facebook.png";
import Fiverr from "./creators/Fiverr.png";
import Upwork from "./creators/Upwork.png";
import Shopee from "./creators/Shopee.png";
import Lynkid from "./creators/Lynkid.png";
import Blogger from "./creators/Blogger.jpg";
import X from "./creators/X.jpg";

// ================= LOGO MAP =================
export const logoMap = {
  // ===== ACCOUNTS =====
  bank: {
    bri: BRI,
    bni: BNI,
    bca: BCA,
    mandiri: Mandiri,
    btn: BTN,
    bsi: BSI, // TAMBAH BSI DISINI

    cimb: CIMB,
    cimbniaga: CIMB,
    bankcimbniaga: CIMB,

    danamon: Danamon,
    maybank: Maybank,
    ocbc: OCBC,
    panin: Panin,
    permata: Permata,

    default: BCA,
  },

  // ===== DEBIT CARD PROVIDERS =====
  debit: {
    visa: Visa,
    mastercard: Mastercard,
    gpn: GPN,
    jcb: JCB,
    prima: Prima,
    unionpay: UnionPay,
    default: GPN,
  },

  digitalbank: {
    jago: Jago,
    bankjago: Jago,

    seabank: SeaBank,
    bankseabank: SeaBank,

    jenius: Jenius,
    blu: Blu,
    linebank: LineBank,
    neocommerce: NeoCommerce,
    bankneocommerce: NeoCommerce,
    allobank: AlloBank,

    default: Jago,
  },

  // alias aman kalau ada data lama
  "digital bank": {
    jago: Jago,
    seabank: SeaBank,
    jenius: Jenius,
    blu: Blu,
    linebank: LineBank,
    neocommerce: NeoCommerce,
    allobank: AlloBank,
    default: Jago,
  },

  ewallet: {
    ovo: OVO,
    gopay: Gopay,
    dana: Dana,
    shopeepay: Shopeepay,
    linkaja: LinkAja,
    doku: DOKU,
    astrapay: AstraPay,
    paypal: PayPal,
    isaku: iSaku,

    default: OVO,
  },

  cash: {
    cash: Cash,
    wallet: Cash,
    default: Cash,
  },

  loan: {
    loan: Loans,
    loans: Loans,
    piutang: Loans,
    receivable: Loans,
    default: Loans,
  },

  // ===== ASSETS =====
  property: {
    house: House,
    apartment: Apartment,
    retailbuilding: RetailBuilding,
  },

  vehicle: {
    car: Car,
    motorcycle: Motorcycle,
    bycicle: Bicycle, // typo dipertahankan
  },

  gadget: {
    laptop: Laptop,
    tablet: Tablet,
    smartphone: Smartphone,
    smartwatch: Smartwatch,
  },

  land: {
    landplot: LandPlot,
    farmfield: FarmField,
  },

  gold: {
    goldbar: GoldBar,
    goldjewelry: GoldJewelry,
  },

  // ===== CREATORS (LENGKAP) =====
  creators: {
    youtube: Youtube,
    tiktok: Tiktok,
    instagram: Instagram,

    twitter: X,
    x: X,

    facebook: Facebook,
    blogger: Blogger,
    blog: Blogger,

    fiverr: Fiverr,
    upwork: Upwork,
    shopee: Shopee,
    lynkid: Lynkid,
  },

  // ===== FALLBACK =====
  other: {
    default: Cash,
  },
};