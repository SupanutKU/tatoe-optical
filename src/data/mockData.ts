import { Product, UserProfile, CartItem, UserAddress, ChatThread } from '../types';

export const APP_LOGO = 'https://lh3.googleusercontent.com/aida/AEtjO1X2mbPwfWNZCVfunqMltjCc0cF7AB_mZ8_NmmmMH1AnsCOHZ_MSzpFPnP6eSgNPmJkA9nDRbWZRdMTjQ2Mf6e9v_JNBrRAW_3XtnkUL-uTbFdAXeEHuIwKSWcXK5YBzfu7-iifGMzlpWAK4cB0Fy56rcQmXsgX2UEH9nVq7pivVdlMx37_itXxLa-pF-nQbMM4SbYpLvJscVvvuG6lne_xXo8rmVPiCE82Skros3NYHzUYNXgRR0YfgFg';

export const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgfK7Go8t0q72RUgLa-XWGo7RtV9xjm3yg-D8dL6fuTyT4Rd8J-h-kpxXjlBONOGKFQXn9HM0Y9VZlUq61KYc15SQB1Om184Pn7dao0hpFA_xLTGGNCQ_ErMbQa9qo0f_n1nz_ACUdBRYGNfBzNbt-_xP4P24_h1X_laWzkmmYjr7i50uxSZQ9k-2jRPdCeSdmGpkgq9FyP2jVpogjkX3U67v2UXa0_MrYt30iaOGkk3G9kRQwmzfg';

export const MAP_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMhzPbrVlJxFWN5s4pyJI8zwqS8zBtCAWKJLsHPjumQmQCCIpQKetBYhmMIVt-HjukKIR1GtyzDCQeby-3wctHNUiL2lZ62YDlFJ_u_0bcuPcZx0ogc6sHGKqXA9CJsdQ2q7a12aaQpTBjTzqLEll2ZdqoAByywT8nk4gPNFqHI3J02TQnm7teHBe7gAw1nkO4USQBJ10E8BKWrcw63OJYwrthblfyASitgYmOgz56lUymFGrh6wgV';

export const PRODUCTS: Product[] = [
  {
    id: 'urban-black',
    name: 'Big Eye Urban Black',
    subtitle: '(Titanium Edition)',
    colorName: 'ดำด้าน Matte Black',
    category: 'prescription',
    shape: 'square',
    material: 'titanium',
    price: 1290,
    originalPrice: 1890,
    discountPercentage: 32,
    rating: 4.8,
    reviewCount: 142,
    salesCount: '500+ ชิ้น',
    tag: 'Ultra Light',
    badge: 'New',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMBqH7_MCWY1cBhlruy859V0cxY-NxSQUxCG4zmhZafutZ28DzT077CdnA1wp1WD-ExOa29UHOjFnOqLZlTEO_p-5SkNIfoNo4It2cze4a4yE5RQnz6XMQfglI8V1VIANCK_-GY6cHv7hmrt_7v1DMt767zG2xO0OUXG4F8S4YnoTiTXv_BYkka0zl0dDFZLzvhxA6nORP00LLfFvlhWKTbNa8kGEpaq0Jv8VrgyCp8iOzL1suXWc',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-cAQpfrs35z2eaX8wu-CrsedXKk5mF215Nt666jG2M-AiJuTYbd9c1Z8hne-PkMmG4F8P04kjQ5QtMaqLL7zmqTNaC0Ya_m3x5fxyDuIqSlXamczEH9fRUNXekpr-Ery2R23p8rG3QX39NuY3eh1IQ3EjnzM9t4nR-g4l8M60jEcq2BX_O6CqQcNisnnjsK20wDFnCQlNW-t3t6VIeqwfb3a16X29BRParJlx6ppvoA9e7yzIgThi',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGwdw5EwibhM1tVKDFBEpehpfZCGSJBRukjt9y_pAuesgD7V3DpEhO07zr0SNP59uIqqh6jg3pNUauoxz9BUlaj76O_GJllnw7fcPoRCnidCx3IVttbThXHPhBDjUIrbbQVx6rzqX_gZXQiB1LGfIw0ukjxALY-tZ1DdXfIUgylA-G2We0MRLs4WS5-jGtHsyKIrVuiADq1IhtHz7gbVi3gOTg3MgWqnLnRCEEWl_to_2y-0vrtmFc',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDORL54HM2tE5Zts5_7xjDgoA-cbLtMFfWyOYJFz9u_ZbJNV5aQ-YwVFO-ypIu9Anp9km4jVLVthwLQN-spyUikDK-jtOyHOeyCOLtTjtW0q3tepA89OORGn7OCY4GY8n0bNfHjaaa28itioWfwRCNtbEQVRmwYe8mV27rWTpjeMxg2q6U8Qxz_opcUYuQymyjCQRQGNSiKueOMlTzMsQv_YUU8DpRaBNqhLKyshhEyryKXVeqChKmk'
    ],
    lensType: 'เลนส์บลูบล็อกปรับแสงอัตโนมัติ',
    weight: '8.5g',
    warranty: '1 ปีเต็ม ศูนย์ไทยแท้',
    size: '51-18-142 mm',
    description: 'กรอบแว่นตารุ่น Urban Black ออกแบบมาเพื่อการสวมใส่ที่สบายตลอดทั้งวัน ผลิตจากไทเทเนียมเกรดพรีเมียม น้ำหนักเบา ทนทาน ไม่กดทับดั้งจมูก พร้อมรองรับการตัดเลนส์ทุกค่าสายตา'
  },
  {
    id: 'classic-01',
    name: 'Big Eye Classic 01',
    subtitle: '(Vintage Edition)',
    colorName: 'สี Black / Gold',
    category: 'prescription',
    shape: 'round',
    material: 'acetate',
    price: 990,
    originalPrice: 1490,
    discountPercentage: 33,
    rating: 4.9,
    reviewCount: 128,
    salesCount: '700+ ชิ้น',
    tag: 'CR-39 Lens',
    badge: 'Best Seller',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9HNbXRFZuqswBX2QX48TXQIqhDPMffK3LJpqoN0ShL2kB0uihjxU_JJ7bYxuP707KoBl2vBl6vIRkjxGYH6W4L0H9sHR_Eji3NwtLztxZpVp-d34ENg3N7kUwB3Jy4FudXqNTErJR8ZtIvGADkiP4KYGBjeYdQl86KtlTSBmOA0JVnqEaGavlFdKCi7d7k677k_eboPAMe6z6m7S_u4G_FmM_KffPP4grg-6Hxrl67ZZZuXtkhsYd',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBifiZoeHXmxQ2qfnqrW7lME15u29e6iuEcb0QhzQsOpHhiCcBs_m2d3DD2qOwJOKtl4Ei4KuZ1YHu88M_93EqQec8RSr6Uf8rp7hEEECk7MucsZXddzanlRNPnihQBTIIpMWSF9f2ymBAB_Aw4ZIROWZRvaqQqVuv78aoM9WAjAC0Mm_seM5nDmM9GSdRxA3QQzi1DO-tjy5uOzm3pKx60eiNzW8eNOQwNgZIwdLFHSaZ9eubafYNt',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC1HcywFyRkbwTEUhrYWPILCWQZJxyugTHruq1m4zZIfPsol0c4uAfZp3hGxQ0BOIoaTTZanKdC3jVfGXtbHQYGSiIorwjwlhbso2n50lO_8wQdrvwDOe4tlMfAJZ8n2nvmNHTnB826xPBghQ2YGp863M1YHfMupqvrZxU2oU2z6cLNIj9Hr3jtPqitDgIPfY7YXR_NC8fdfl5dN4QFC_pE6ckTOJ_AhwGKekv2WEnH4CEVsAJdUYpc'
    ],
    lensType: 'เลนส์มัลติโค้ตตัดแสงสะท้อน',
    weight: '11g',
    warranty: '1 ปีเต็ม',
    size: '49-20-145 mm',
    description: 'กรอบทรงหยดน้ำคลาสสิก ลวดลายกระทองหรูหราเบาบาง เสริมบุคลิกให้ดูอบอุ่น มั่นใจ เข้ากับรูปหน้าชาวเอเชียได้อย่างลงตัว'
  },
  {
    id: 'blue-light',
    name: 'Big Eye Blue Light',
    subtitle: '(Digital Defense)',
    colorName: 'สีกรอบ Rose Gold Clear',
    category: 'blue-light',
    shape: 'drop',
    material: 'tr90',
    price: 1490,
    originalPrice: 1990,
    discountPercentage: 25,
    rating: 5.0,
    reviewCount: 88,
    salesCount: '350+ ชิ้น',
    tag: 'Blue Block',
    stockStatus: 'low_stock',
    stockCount: 3,
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBX4UT9DXQs1y_6y2AlVIMySWOyMPxCZSW6kUjoYdmbXLh0lSdKOKEoujAwx5O9VBuAe3TwvHzTl-9V2dX9rvpdua3eDH7aa9g2_3ViPYyN6yB1MtR8t8cyaToczivKkxpRiTfhRNuzcz1jdoXd6LhOcze72m96xQOW68e1pI1FKF4jzul6iHpQjjCDe2DBca7XzkSXaT9K95IdgTBvSIy3pbI7jg5se0wLK7rVUfGCImw_86ExOt4J',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDShw0Eu2EwPrQoORLABHtGzCNT5PGSJb-RTvfi28u-wdKFewCl91cZnnu8ig0fygQKjTO7xioIySfHewSilkvHx5-QVlF357hmn_-Kogrj2qvDWeaa67FhUIl02d3DfQwZu6VG54kq98rA-pZLuv83Z6iKlmlLGg_LdjMy-hSCv1v3VuN7jNLYFFlxRFDB3VSyD1teN9FIU44vBZvwi6I_hLTUZ-6BwcoRsigtiZ0stbx25BfbqH28'
    ],
    lensType: 'เลนส์ถนอมสายตาคอมพิวเตอร์ ตัดแสงสีฟ้า 99%',
    weight: '9.2g',
    warranty: '1 ปีเต็ม',
    size: '50-19-140 mm',
    description: 'กรอบใสโทนโรสโกลด์โปร่งแสง ออกแบบมาสำหรับคนทำงานหน้าจอคอมพิวเตอร์และสมาร์ตโฟน ลดอาการเมื่อยล้าดวงตา'
  },
  {
    id: 'sun-pro',
    name: 'Big Eye Sun Pro',
    subtitle: '(UV Protection Polarized)',
    colorName: 'สีกรอบ Dark Tortoise',
    category: 'sunglasses',
    shape: 'square',
    material: 'acetate',
    price: 1790,
    originalPrice: 2490,
    discountPercentage: 28,
    rating: 4.7,
    reviewCount: 65,
    salesCount: '210+ ชิ้น',
    tag: 'Polarized',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqItlUu3-fG6K4XgbIbI8xKbIxAfkYZb_LRoGN2vb3x04voGZtUm5yDJFGCd_SapGt8b6Tt3TxJhk1YSdjTYdbkubACQeD1Hx6PHKf2l5yqMm9iaDjj-oPaos-zPBFf-_QYEQwCxPUWPiqw9N2YXf45XmvDbiywpytmVcpECBrf6PBXPJFHoTeXos0LHBLaDoxZx09azvMlY2bBG0-e6k0BGCq4sXt5jV_5k4WiGtdWZJVVdx_V2N_',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDXgQh_v-2mzHysj_zjL_n1R3Xzl9fIzpVB3n-xWhzmPRWS7A8HfyZvhJHjVerqRQeU2_BE5UKpf4d31grvkVmSknU2f3Lvs7-hEpshv2CeDCEsPS89lEjydOhyhoVV-UHnyQ0inqACoAnjm5Nf3b79OY8nyCWNQ-vo2nR3Avr7501Q6-dEmwRGfANaXfbWGoZHm3KS9EOqk9K6UmhrDPZLvEYwXQmVcGktoUGN0mT8lSGiiT4UQcsD'
    ],
    lensType: 'เลนส์ Polarized กันแดดสะท้อน UV400 สบายตา',
    weight: '14g',
    warranty: '1 ปีเต็ม',
    size: '54-18-145 mm',
    description: 'แว่นกันแดดทรงสปอร์ตเอ็กเซ็กคิวทีฟ เลนส์โพลาไรซ์ตัดแสงสะท้อนบนผิวน้ำและถนน สวมใส่สบายกลางแจ้ง'
  },
  {
    id: 'minimalist-silver',
    name: 'Big Eye Minimalist Silver',
    subtitle: '(Ultra-fine Titanium)',
    colorName: 'สีกรอบ Pure Silver',
    category: 'prescription',
    shape: 'round',
    material: 'titanium',
    price: 1190,
    originalPrice: 1690,
    discountPercentage: 29,
    rating: 4.9,
    reviewCount: 110,
    salesCount: '420+ ชิ้น',
    tag: 'Pure Titanium',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAudWj2xQCJdv8oAPm4mc-Oh6R3HZhG2I8Xe3C8vC4sioG1xXFm1Bs9UtFYJ3QKg8IAgAfKXslaDKOZHSOzt5WTU2RH3rlL1_S63bE93zfcp_hMGpZCZFznW3V3NF2Mg-3V26_GMbmaez42NxgBDjkhxvwB05gaBPLsoaXYOchMYlTHSMIMwQvYOkKL24lf0gSvvhBzG57BB7BVaszf_10csRdO2-eDjwMT3sLxTYTHJ-9MYfjrhO-n'
    ],
    lensType: 'รองรับเลนส์ย่อบาง 1.60/1.67',
    weight: '7.8g',
    warranty: '1 ปีเต็ม',
    size: '50-18-142 mm',
    description: 'แว่นตาดีไซน์มินิมอลแบบญี่ปุ่น ไร้ขอบบน กรอบไทเทเนียมสีเงินบริสุทธิ์ ให้ความรู้สึกโปร่ง เบาสบาย ราวกับไม่ได้สวมใส่'
  },
  {
    id: 'retro-vintage',
    name: 'Big Eye Retro Vintage',
    subtitle: '(Handcrafted Acetate)',
    colorName: 'สีกรอบ Amber Havana',
    category: 'prescription',
    shape: 'round',
    material: 'acetate',
    price: 1390,
    originalPrice: 1890,
    discountPercentage: 26,
    rating: 4.8,
    reviewCount: 95,
    salesCount: '310+ ชิ้น',
    tag: 'Handmade',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIaiYIJW70zu6ufptXQ1BlKO7bgzb4GJD2OjUK4ZOlj9TozLwa-u64JwEuHy2i7QAPyDrxG3Amed5LrYj1XB3T1Ltew_ZUBJdn5SDwwZZlXJ5kCvuwZ43lpDAOA6ZVlQ-7oH-Xy4LOzUG7oPXrPmXmg6W-CEgO8_dKMOmsgrbtJxZJ6kwp9v73n7X05RdDRGBYEM5BmRGc8EcFXQ1Xvy4NYuSlOJwl8rb_UyyrjYvdmu75pGW0w1QE'
    ],
    lensType: 'เลนส์มัลติโค้ตทนรอยขีดข่วน',
    weight: '12g',
    warranty: '1 ปีเต็ม',
    size: '48-21-145 mm',
    description: 'งานฝีมืออะซิเตตนำเข้า ลวดลายแอมเบอร์ฮาวานาอบอุ่น แข็งแรงทนทาน ผิวสัมผัสนุ่มนวลต่อผิวหนัง'
  },
  {
    id: 'sports-active',
    name: 'Big Eye Sports Active Polarized',
    subtitle: '(Ultra Grip Performance)',
    colorName: 'สีกรอบ Matte Navy / Lime',
    category: 'sports',
    shape: 'square',
    material: 'tr90',
    price: 1590,
    originalPrice: 2290,
    discountPercentage: 30,
    rating: 4.9,
    reviewCount: 74,
    salesCount: '190+ ชิ้น',
    tag: 'Sports Grip',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqItlUu3-fG6K4XgbIbI8xKbIxAfkYZb_LRoGN2vb3x04voGZtUm5yDJFGCd_SapGt8b6Tt3TxJhk1YSdjTYdbkubACQeD1Hx6PHKf2l5yqMm9iaDjj-oPaos-zPBFf-_QYEQwCxPUWPiqw9N2YXf45XmvDbiywpytmVcpECBrf6PBXPJFHoTeXos0LHBLaDoxZx09azvMlY2bBG0-e6k0BGCq4sXt5jV_5k4WiGtdWZJVVdx_V2N_',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDXgQh_v-2mzHysj_zjL_n1R3Xzl9fIzpVB3n-xWhzmPRWS7A8HfyZvhJHjVerqRQeU2_BE5UKpf4d31grvkVmSknU2f3Lvs7-hEpshv2CeDCEsPS89lEjydOhyhoVV-UHnyQ0inqACoAnjm5Nf3b79OY8nyCWNQ-vo2nR3Avr7501Q6-dEmwRGfANaXfbWGoZHm3KS9EOqk9K6UmhrDPZLvEYwXQmVcGktoUGN0mT8lSGiiT4UQcsD'
    ],
    lensType: 'เลนส์ Polarized กันแดดและละอองน้ำ สบายตาขณะวิ่ง/ปั่นจักรยาน',
    weight: '16g',
    warranty: '1 ปีเต็ม',
    size: '56-17-140 mm',
    description: 'แว่นตากีฬาสำหรับวิ่งและปั่นจักรยาน มีแผ่นยางกันลื่น Silcone Grip แนบกระชับใบหน้า ไม่เลื่อนหลุดแม้เหงื่อออกมาก'
  },
  {
    id: 'sports-aerofit',
    name: 'Big Eye AeroFit TR90',
    subtitle: '(Impact Resistant)',
    colorName: 'สีกรอบ Carbon Black',
    category: 'sports',
    shape: 'square',
    material: 'tr90',
    price: 1390,
    originalPrice: 1990,
    discountPercentage: 30,
    rating: 4.8,
    reviewCount: 52,
    salesCount: '140+ ชิ้น',
    tag: 'Anti-Slip',
    stockStatus: 'in_stock',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMBqH7_MCWY1cBhlruy859V0cxY-NxSQUxCG4zmhZafutZ28DzT077CdnA1wp1WD-ExOa29UHOjFnOqLZlTEO_p-5SkNIfoNo4It2cze4a4yE5RQnz6XMQfglI8V1VIANCK_-GY6cHv7hmrt_7v1DMt767zG2xO0OUXG4F8S4YnoTiTXv_BYkka0zl0dDFZLzvhxA6nORP00LLfFvlhWKTbNa8kGEpaq0Jv8VrgyCp8iOzL1suXWc'
    ],
    lensType: 'เลนส์ Polycarbonate ทนแรงกระแทก ตัดแสงสะท้อน',
    weight: '13.5g',
    warranty: '1 ปีเต็ม',
    size: '53-18-142 mm',
    description: 'แว่นสปอร์ตน้ำหนักเบาพิเศษ ยืดหยุ่นสูง ทนทานต่อการตกกระแทก เหมาะสำหรับฟิตเนสและกิจกรรมกลางแจ้ง'
  }
];

export const INITIAL_ADDRESSES: UserAddress[] = [
  {
    id: 'addr-1',
    title: 'หอพักจุฬาฯ (ที่อยู่หลัก)',
    type: 'home',
    recipientName: 'คุณพิชญา วงศ์สว่าง',
    phone: '089-123-4567',
    addressLine: 'หอพักนักศึกษาจุฬาฯ อาคาร A ห้อง 412 ถนนพญาไท',
    subdistrict: 'วังใหม่',
    district: 'ปทุมวัน',
    province: 'กรุงเทพฯ',
    postalCode: '10330',
    isDefault: true
  },
  {
    id: 'addr-2',
    title: 'บริษัท / ออฟฟิศ (จามจุรีสแควร์)',
    type: 'office',
    recipientName: 'คุณพิชญา (แผนก Data Science)',
    phone: '02-123-4567',
    addressLine: 'อาคารจัตุรัสจามจุรี ชั้น 18 ห้อง 1804 ถนนพระราม 4',
    subdistrict: 'ปทุมวัน',
    district: 'ปทุมวัน',
    province: 'กรุงเทพฯ',
    postalCode: '10330',
    isDefault: false
  },
  {
    id: 'addr-3',
    title: 'บ้านคุณพ่อคุณแม่',
    type: 'home',
    recipientName: 'คุณพิชญา วงศ์สว่าง',
    phone: '081-987-6543',
    addressLine: '88/14 หมู่บ้านพฤกษาภิรมย์ ซอย 5 ถนนบรมราชชนนี',
    subdistrict: 'ศาลาธรรมสพน์',
    district: 'ทวีวัฒนา',
    province: 'กรุงเทพฯ',
    postalCode: '10170',
    isDefault: false
  }
];

export const formatAddress = (addr: UserAddress): string => {
  return `${addr.addressLine} แขวง/ตำบล${addr.subdistrict} เขต/อำเภอ${addr.district} จ.${addr.province} ${addr.postalCode}`;
};

export const INITIAL_USER: UserProfile = {
  name: 'คุณพิชญา วงศ์สว่าง',
  role: 'admin', // Default to admin or allow toggle so user can directly use admin powers or switch
  tier: 'Big Eye Gold Member ⭐️',
  memberTier: 'Big Eye Club - Gold Member',
  points: 420,
  email: 'pichaya.w@student.chula.ac.th',
  phone: '089-123-4567',
  avatarUrl: USER_AVATAR,
  currentOrdersCount: 2,
  discountCouponsCount: 1,
  wishlistCount: 4,
  shippingAddress: formatAddress(INITIAL_ADDRESSES[0]),
  addresses: INITIAL_ADDRESSES,
  prescription: {
    od: { sphere: '-1.50', cylinder: '0.00' },
    os: { sphere: '-1.75', cylinder: '0.00' },
    lastChecked: '12 ม.ค. 2025'
  }
};

export const INITIAL_CART_ITEMS: CartItem[] = [
  {
    id: 'cart-1',
    product: PRODUCTS[0], // Big Eye Urban Black
    selectedColor: 'ดำด้าน Matte Black',
    quantity: 1,
    prescriptionNote: 'สายตาสั้น R: -1.75 | L: -2.00',
    hasPrescription: true,
    selected: true,
    lensUpgrade: 'เลนส์: กรองแสง Blue Light 99%'
  },
  {
    id: 'cart-2',
    product: PRODUCTS[1], // Big Eye Classic 01
    selectedColor: 'สีกระทอง Tortoise Gold',
    quantity: 1,
    prescriptionNote: 'ไม่มีค่าสายตา (เลนส์กรองแสงแฟชั่น)',
    hasPrescription: false,
    selected: true,
    lensUpgrade: 'เลนส์: มัลติโค้ตธรรมดา (ตัดแสงสะท้อน)'
  }
];

// Initial Chat Threads (Product inquiries and customer chats)
export const INITIAL_CHAT_THREADS: ChatThread[] = [
  {
    id: 'thread-1',
    customerName: 'คุณพิชญา วงศ์สว่าง',
    customerPhone: '089-123-4567',
    product: {
      id: PRODUCTS[0].id,
      name: PRODUCTS[0].name,
      price: PRODUCTS[0].price,
      imageUrl: PRODUCTS[0].images[0],
      category: PRODUCTS[0].category,
      lensType: PRODUCTS[0].lensType,
      colorName: PRODUCTS[0].colorName
    },
    unread: true,
    messages: [
      {
        id: 'msg-1',
        sender: 'store',
        senderName: 'ร้านTATOE Optical',
        text: 'สวัสดีค่ะ ร้านTATOE Optical ยินดีให้บริการค่ะ 👓 มีคำถามเกี่ยวกับขนาดกรอบ หรือการเลือกเลนส์ปรึกษาได้เลยนะคะ',
        time: '10:30 น.'
      },
      {
        id: 'msg-2',
        sender: 'customer',
        senderName: 'คุณพิชญา (ลูกค้า)',
        text: 'สวัสดีค่ะ สนใจแว่นตารุ่น Big Eye Urban Black กรอบไทเทเนียมนี้ น้ำหนักเบาใส่สบายไหมคะ แล้วถ้าสายตาสั้น -1.75 ตัดเลนส์บลูบล็อคมีของพร้อมส่งไหมคะ?',
        time: '10:32 น.',
        product: {
          id: PRODUCTS[0].id,
          name: PRODUCTS[0].name,
          price: PRODUCTS[0].price,
          imageUrl: PRODUCTS[0].images[0],
          category: PRODUCTS[0].category,
          lensType: PRODUCTS[0].lensType,
          colorName: PRODUCTS[0].colorName
        }
      }
    ]
  },
  {
    id: 'thread-2',
    customerName: 'คุณอานนท์ รุ่งเรือง',
    customerPhone: '082-999-1122',
    product: {
      id: PRODUCTS[1].id,
      name: PRODUCTS[1].name,
      price: PRODUCTS[1].price,
      imageUrl: PRODUCTS[1].images[0],
      category: PRODUCTS[1].category,
      lensType: PRODUCTS[1].lensType,
      colorName: PRODUCTS[1].colorName
    },
    unread: true,
    messages: [
      {
        id: 'msg-3',
        sender: 'customer',
        senderName: 'คุณอานนท์ (ลูกค้า)',
        text: 'รบกวนสอบถามรุ่น Classic 01 สีกระทอง มีตัวอย่างให้ลองที่หน้าร้านสาขาสยามสแควร์ไหมครับ พอดีทำงานอยู่แถวนั้นจะแวะไปลองช่วงเย็นครับ',
        time: '11:15 น.',
        product: {
          id: PRODUCTS[1].id,
          name: PRODUCTS[1].name,
          price: PRODUCTS[1].price,
          imageUrl: PRODUCTS[1].images[0],
          category: PRODUCTS[1].category,
          lensType: PRODUCTS[1].lensType,
          colorName: PRODUCTS[1].colorName
        }
      }
    ]
  },
  {
    id: 'thread-3',
    customerName: 'คุณมินตรา สุขใจ',
    customerPhone: '086-444-5566',
    product: {
      id: PRODUCTS[2].id,
      name: PRODUCTS[2].name,
      price: PRODUCTS[2].price,
      imageUrl: PRODUCTS[2].images[0],
      category: PRODUCTS[2].category,
      lensType: PRODUCTS[2].lensType,
      colorName: PRODUCTS[2].colorName
    },
    unread: false,
    messages: [
      {
        id: 'msg-4',
        sender: 'customer',
        senderName: 'คุณมินตรา (ลูกค้า)',
        text: 'รุ่น Titan Air ทรงเหลี่ยม เหมาะกับคนรูปหน้ากลมไหมคะ?',
        time: 'เมื่อวาน 16:40 น.',
        product: {
          id: PRODUCTS[2].id,
          name: PRODUCTS[2].name,
          price: PRODUCTS[2].price,
          imageUrl: PRODUCTS[2].images[0],
          category: PRODUCTS[2].category,
          lensType: PRODUCTS[2].lensType,
          colorName: PRODUCTS[2].colorName
        }
      },
      {
        id: 'msg-5',
        sender: 'admin',
        senderName: 'แอดมิน TATOE Optical (Admin)',
        text: 'เหมาะมากเลยค่ะ! ทรงเหลี่ยมมนจะช่วยปรับรูปหน้ากลมให้ดูมีมิติและเรียวขึ้นอย่างเป็นธรรมชาติค่ะ สามารถลองใช้ฟังก์ชัน Virtual Try-On สแกนหน้าในแอพก่อนได้นะคะ 👓✨',
        time: 'เมื่อวาน 16:45 น.'
      }
    ]
  }
];

// Convenience Aliases for imports
export const MOCK_PRODUCTS = PRODUCTS;
export const MOCK_USER = INITIAL_USER;
export const INITIAL_CART = INITIAL_CART_ITEMS;

export const INITIAL_DELIVERY_ORDER: import('../types').DeliveryOrder = {
  orderId: '#BEY-2025058',
  trackingNumber: 'TH8492048201',
  courier: 'Flash Express',
  currentStage: 'in_transit',
  statusLabel: 'อยู่ระหว่างการขนส่ง',
  statusDescription: 'พัสดุกำลังเดินทางไปยังศูนย์กระจายสินค้าปลายทาง',
  estimatedDelivery: '17 พ.ค. 2025',
  updatedTime: '16 พ.ค. 2025 • 09:15 น.',
  itemsCount: 2,
  steps: [
    {
      id: 'step-1',
      stage: 'order_placed',
      title: 'สั่งซื้อสำเร็จและชำระเงินแล้ว',
      detail: 'ชำระผ่าน PromptPay QR Code เรียบร้อย ตรวจสอบยอดเงินถูกต้อง',
      time: '14 พ.ค. 2025 • 10:30 น.',
      completed: true
    },
    {
      id: 'step-2',
      stage: 'crafting',
      title: 'ตัดเลนส์และประกอบแว่นโดยช่างชำนาญการ',
      detail: 'ตรวจสอบจุดกึ่งกลางตาดำ (PD) และ QC ค่าสายตาตามใบสั่งแพทย์',
      time: '15 พ.ค. 2025 • 14:00 น.',
      completed: true
    },
    {
      id: 'step-3',
      stage: 'in_transit',
      title: 'อยู่ระหว่างการขนส่ง',
      detail: 'พัสดุออกจากศูนย์กระจายสินค้าหลักวังน้อย จ.พระนครศรีอยุธยา',
      time: '16 พ.ค. 2025 • 09:15 น.',
      completed: true,
      current: true
    },
    {
      id: 'step-4',
      stage: 'at_sorting_hub',
      title: 'พัสดุถึงสาขาปลายทางแล้ว',
      detail: 'พัสดุถึงศูนย์คัดแยกสาขาปลายทาง (DC ลาดพร้าว/จตุจักร) รอคัดแยกเตรียมนำจ่าย',
      time: 'คาดการณ์ 16 พ.ค. 2025 • 18:30 น.',
      completed: false
    },
    {
      id: 'step-5',
      stage: 'out_for_delivery',
      title: 'พนักงานกำลังนำจ่ายพัสดุ',
      detail: 'พนักงานนำจ่าย Flash Express (คุณสมชาย บุญมี 089-456-7890) กำลังนำส่งให้คุณ',
      time: 'คาดการณ์ 17 พ.ค. 2025 • 10:00 น.',
      completed: false
    },
    {
      id: 'step-6',
      stage: 'delivered',
      title: 'จัดส่งสำเร็จเรียบร้อย',
      detail: 'ผู้รับได้รับพัสดุเรียบร้อย เซ็นรับมอบพัสดุ',
      time: 'คาดการณ์ 17 พ.ค. 2025 • 13:45 น.',
      completed: false
    }
  ]
};

export const DELIVERY_STAGE_CONFIG: Record<
  import('../types').DeliveryStage,
  {
    label: string;
    description: string;
    icon: string;
    badgeColor: string;
    pushTitle: string;
    pushBody: string;
  }
> = {
  order_placed: {
    label: 'สั่งซื้อสำเร็จ',
    description: 'ทางร้านได้รับคำสั่งซื้อและยอดชำระเงินเรียบร้อยแล้ว',
    icon: 'receipt_long',
    badgeColor: 'bg-blue-100 text-blue-800',
    pushTitle: '💳 ยืนยันคำสั่งซื้อสำเร็จ',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 ได้รับการยืนยันแล้ว ทางร้านกำลังส่งใบสั่งเลนส์ไปยังห้องปฏิบัติการ'
  },
  crafting: {
    label: 'กำลังประกอบแว่น',
    description: 'ช่างผู้ชำนาญการกำลังตัดประกอบเลนส์และตรวจสอบมาตรฐาน QC',
    icon: 'construction',
    badgeColor: 'bg-amber-100 text-amber-800',
    pushTitle: '🔬 แว่นตาของคุณกำลังประกอบ',
    pushBody: 'ช่างเทคนิคกำลังเจียรประกอบเลนส์มัลติโค้ตและวัดจุดกึ่งกลางตาดำ (PD) อย่างแม่นยำ'
  },
  in_transit: {
    label: 'อยู่ระหว่างการขนส่ง',
    description: 'พัสดุออกจากศูนย์กระจายสินค้าวังน้อย จ.พระนครศรีอยุธยา',
    icon: 'local_shipping',
    badgeColor: 'bg-primary-fixed text-on-primary-fixed',
    pushTitle: '🚚 พัสดุเริ่มออกเดินทางแล้ว!',
    pushBody: 'Flash Express รับพัสดุ #BEY-2025058 ออกจากคลังสินค้าหลักแล้ว กำลังมุ่งหน้าสู่กรุงเทพฯ'
  },
  at_sorting_hub: {
    label: 'พัสดุถึงสาขาปลายทางแล้ว',
    description: 'พัสดุถึงศูนย์คัดแยกสาขาปลายทาง (DC ลาดพร้าว) รอจัดเตรียมนำจ่าย',
    icon: 'warehouse',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    pushTitle: '📍 พัสดุถึงสาขาปลายทางแล้ว!',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 เดินทางถึงศูนย์กระจายสินค้าปลายทาง (DC ลาดพร้าว) เรียบร้อยแล้ว พร้อมนำจ่ายในรอบถัดไป'
  },
  out_for_delivery: {
    label: 'กำลังนำจ่ายพัสดุ',
    description: 'พนักงานส่งพัสดุกำลังเดินทางนำส่งพัสดุไปยังที่อยู่ของคุณ',
    icon: 'delivery_dining',
    badgeColor: 'bg-orange-100 text-orange-900',
    pushTitle: '🛵 พนักงานกำลังนำจ่ายพัสดุให้คุณ!',
    pushBody: 'คุณสมชาย บุญมี (Flash Express 089-456-7890) กำลังนำส่งพัสดุ #BEY-2025058 โปรดเตรียมรับสาย'
  },
  delivered: {
    label: 'จัดส่งสำเร็จเรียบร้อย',
    description: 'ผู้รับได้รับพัสดุเรียบร้อย ขอบคุณที่ไว้วางใจร้านTATOE Optical',
    icon: 'check_circle',
    badgeColor: 'bg-emerald-500 text-white',
    pushTitle: '🎉 จัดส่งพัสดุสำเร็จเรียบร้อยแล้ว!',
    pushBody: 'คำสั่งซื้อ #BEY-2025058 ส่งถึงมือคุณเรียบร้อยแล้ว ขอให้มีความสุขกับการสวมใส่แว่นตานะคะ ✨'
  }
};

export const INITIAL_NOTIFICATIONS: import('../types').AppNotification[] = [
  {
    id: 'notif-1',
    title: '🚚 พัสดุกำลังจัดส่ง!',
    body: 'คำสั่งซื้อ #BEY-2025058 พัสดุออกจากศูนย์กระจายสินค้าวังน้อยแล้ว',
    timestamp: '16 พ.ค. 2025 • 09:15 น.',
    type: 'delivery',
    orderId: '#BEY-2025058',
    stage: 'in_transit',
    read: false
  },
  {
    id: 'notif-2',
    title: '🔬 ประกอบแว่นตาเสร็จสิ้น',
    body: 'แว่นตา Big Eye Urban Black ตัดประกอบเลนส์และผ่านการ QC พร้อมส่งมอบ',
    timestamp: '15 พ.ค. 2025 • 14:00 น.',
    type: 'delivery',
    orderId: '#BEY-2025058',
    stage: 'crafting',
    read: true
  }
];

export const INITIAL_REVIEWS: import('../types').ProductReview[] = [
  {
    id: 'rev-1',
    productId: 'urban-black',
    authorName: 'คุณกิตติศักดิ์ พ.',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    date: '15 พ.ค. 2025',
    comment: 'กรอบไทเทเนียมเบามากจริงๆ ครับ ใส่ทำงานหน้าจอคอม 8-9 ชั่วโมง ไม่เจ็บดั้งจมูกเลย เลนส์บลูบล็อกตัดแสงสีฟ้าดี สบายตากว่าเดิมเยอะมาก แนะนำเลยครับ!',
    photos: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAZMBqH7_MCWY1cBhlruy859V0cxY-NxSQUxCG4zmhZafutZ28DzT077CdnA1wp1WD-ExOa29UHOjFnOqLZlTEO_p-5SkNIfoNo4It2cze4a4yE5RQnz6XMQfglI8V1VIANCK_-GY6cHv7hmrt_7v1DMt767zG2xO0OUXG4F8S4YnoTiTXv_BYkka0zl0dDFZLzvhxA6nORP00LLfFvlhWKTbNa8kGEpaq0Jv8VrgyCp8iOzL1suXWc',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA-cAQpfrs35z2eaX8wu-CrsedXKk5mF215Nt666jG2M-AiJuTYbd9c1Z8hne-PkMmG4F8P04kjQ5QtMaqLL7zmqTNaC0Ya_m3x5fxyDuIqSlXamczEH9fRUNXekpr-Ery2R23p8rG3QX39NuY3eh1IQ3EjnzM9t4nR-g4l8M60jEcq2BX_O6CqQcNisnnjsK20wDFnCQlNW-t3t6VIeqwfb3a16X29BRParJlx6ppvoA9e7yzIgThi'
    ],
    colorName: 'ดำด้าน Matte Black',
    lensType: 'เลนส์บลูบล็อกปรับแสงอัตโนมัติ',
    verifiedPurchase: true,
    helpfulCount: 24
  },
  {
    id: 'rev-2',
    productId: 'urban-black',
    authorName: 'คุณณิชาภัทร ว.',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    date: '10 พ.ค. 2025',
    comment: 'สั่งตัดสายตาสั้น -2.50 ทางร้านประกอบเลนส์ได้เนี้ยบมาก ขอบเลนส์ไม่ล้นกรอบ สีกรอบแมตต์แบล็คดูเรียบหรู ส่งไวมาก แพ็กเกจมีกล่องหนังและผ้าเช็ดเลนส์อย่างดี ประทับใจมากค่ะ ✨',
    photos: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGwdw5EwibhM1tVKDFBEpehpfZCGSJBRukjt9y_pAuesgD7V3DpEhO07zr0SNP59uIqqh6jg3pNUauoxz9BUlaj76O_GJllnw7fcPoRCnidCx3IVttbThXHPhBDjUIrbbQVx6rzqX_gZXQiB1LGfIw0ukjxALY-tZ1DdXfIUgylA-G2We0MRLs4WS5-jGtHsyKIrVuiADq1IhtHz7gbVi3gOTg3MgWqnLnRCEEWl_to_2y-0vrtmFc'
    ],
    colorName: 'ดำด้าน Matte Black',
    lensType: 'เลนส์มัลติโค้ตย่อบาง 1.60',
    verifiedPurchase: true,
    helpfulCount: 18
  },
  {
    id: 'rev-3',
    productId: 'urban-black',
    authorName: 'คุณธนพล ม.',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4,
    date: '3 พ.ค. 2025',
    comment: 'ดีไซน์สวย โมเดิร์น ขาแว่นยืดหยุ่นดีไม่บีบขมับ แต่ขอหัก 1 ดาวเรื่องขนส่งช้าไป 1 วัน นอกนั้นแว่นกับเลนส์คุณภาพเกินราคาครับ',
    photos: [],
    colorName: 'กันเมทัล Gunmetal Grey',
    lensType: 'เลนส์มาตรฐาน',
    verifiedPurchase: true,
    helpfulCount: 7
  },
  {
    id: 'rev-4',
    productId: 'classic-01',
    authorName: 'คุณปาริฉัตร ส.',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    date: '12 พ.ค. 2025',
    comment: 'ทรงหยดน้ำวินเทจสวยเก๋มาก เข้ากับรูปหน้ากลมได้พอดี ลายกระทองดูมีมิติ ไม่แก่เลยค่ะ เพื่อนที่ทำงานทักหลายคนมากว่าแว่นสวย',
    photos: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC9HNbXRFZuqswBX2QX48TXQIqhDPMffK3LJpqoN0ShL2kB0uihjxU_JJ7bYxuP707KoBl2vBl6vIRkjxGYH6W4L0H9sHR_Eji3NwtLztxZpVp-d34ENg3N7kUwB3Jy4FudXqNTErJR8ZtIvGADkiP4KYGBjeYdQl86KtlTSBmOA0JVnqEaGavlFdKCi7d7k677k_eboPAMe6z6m7S_u4G_FmM_KffPP4grg-6Hxrl67ZZZuXtkhsYd'
    ],
    colorName: 'สีกระทอง Tortoise Gold',
    lensType: 'เลนส์มัลติโค้ตตัดแสงสะท้อน',
    verifiedPurchase: true,
    helpfulCount: 31
  }
];

