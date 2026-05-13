
import { Transaction, MonthlyFlow, CategoryData } from './types';

export interface ProjectData {
  profile: {
    vision: string;
    missions: string[];
    agenda: string[];
    joinEnabled?: boolean;
    contributions: Array<{
      title: string;
      value: string;
      description: string;
      illustration: 'reduction' | 'sorted' | 'utilized';
    }>;
    team: Array<{
      name: string;
      role: string;
      photo: string;
    }>;
  };
  transactions: Transaction[];
  monthlyFlow: MonthlyFlow[];
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  summary: {
    balance: number;
    income: number;
    expense: number;
  };
}

export const PROJECT_DATA: Record<string, ProjectData> = {
  'Resik': {
    profile: {
      vision: 'Menjadikan pengelolaan barang bekas sebagai gerakan berkelanjutan yang amanah, berdampak, dan bernilai bagi pendidikan.',
      missions: [
        'Mengoptimalkan pengumpulan dan penjualan barang bekas secara rutin.',
        'Menyalurkan hasil pengelolaan untuk program Cinta Guru dan kebutuhan umat.',
        'Membangun budaya peduli lingkungan di kalangan wali murid dan masyarakat.'
      ],
      agenda: [
        "Kumpul tiap Jum'at kedua dan keempat setiap bulan untuk sortir sampah.",
        'Drop point limbah rumah tangga setiap hari Sabtu pekan pertama.',
        'Rekap dan penjualan ke pengepul pada akhir bulan.'
      ],
      contributions: [
        {
          title: 'Pengurangan Limbah',
          value: '40 kg',
          description: 'Limbah campuran berhasil dialihkan dari penumpukan di TPA.',
          illustration: 'reduction'
        },
        {
          title: 'Sampah Tersortir',
          value: '33 kg',
          description: 'Sampah dipilah sesuai jenis untuk memudahkan proses lanjut.',
          illustration: 'sorted'
        },
        {
          title: 'Sampah yang Dimanfaatkan',
          value: '29 kg',
          description: 'Sampah bernilai berhasil dimanfaatkan kembali secara rutin.',
          illustration: 'utilized'
        }
      ],
      team: [
        { name: 'Kak Idhka', role: 'CEO', photo: '' },
        { name: 'Kak Yeni', role: 'Bendahara', photo: '' },
        { name: 'Kak Ratna', role: 'Tim Resik', photo: '' },
        { name: 'Kak Wulan', role: 'Tim Resik', photo: '' },
        { name: 'Kak Diyah', role: 'Tim Resik', photo: '' },
        { name: 'Kak Rini', role: 'Bu Nyai', photo: '' }
      ]
    },
    summary: { balance: 1602035, income: 6708555, expense: 5106520 },
    transactions: [
      { id: 1, date: '18/10/24', description: 'Penjualan galon bekas', income: 20000, expense: null, balance: 20000 },
      { id: 2, date: '26/02/25', description: 'Penjualan ke pengepul 1', income: 96000, expense: null, balance: 116000 },
      { id: 3, date: '26/02/25', description: 'Penjualan ke pengepul 2', income: 124140, expense: null, balance: 240140 },
      { id: 4, date: '14/03/25', description: 'Penjualan botol mineral', income: 5000, expense: null, balance: 245140 },
      { id: 5, date: '15/03/25', description: 'Penjualan ke pengepul 1', income: 696400, expense: null, balance: 941540 },
      { id: 6, date: '15/03/25', description: 'Penjualan ke pengepul 2', income: 260225, expense: null, balance: 1201765 },
      { id: 7, date: '17/03/25', description: 'Penjualan ke pengepul 2', income: 30150, expense: null, balance: 1231915 },
      { id: 8, date: '17/03/25', description: 'Penjualan accu bekas', income: 15000, expense: null, balance: 1246915 },
      { id: 9, date: '17/03/25', description: 'Penyaluran Program Cinta Guru (Ramadhan)', income: null, expense: 622500, balance: 624415 },
      { id: 10, date: '24/05/25', description: 'Penjualan ke pengepul 1', income: 354500, expense: null, balance: 978915 },
      { id: 11, date: '24/05/25', description: 'Penjualan ke pengepul 2', income: 324905, expense: null, balance: 1303820 },
      { id: 12, date: '24/05/25', description: 'Pembelian BBM', income: null, expense: 50000, balance: 1253820 },
      { id: 13, date: '24/05/25', description: 'Jasa pembersihan', income: null, expense: 50000, balance: 1203820 },
      { id: 14, date: '25/05/25', description: 'Alokasi Tabungan Cinta Guru (Bendahara)', income: null, expense: 339703, balance: 864117 },
      { id: 15, date: '20/07/25', description: 'Cetak banner & poster (1)', income: null, expense: 170000, balance: 694117 },
      { id: 16, date: '20/07/25', description: 'Cetak banner & poster (2)', income: null, expense: 165000, balance: 529117 },
      { id: 17, date: '02/08/25', description: 'Penjualan ke pengepul 1', income: 331885, expense: null, balance: 861002 },
      { id: 18, date: '02/08/25', description: 'Penjualan ke pengepul 2 & Mesin Cuci', income: 380650, expense: null, balance: 1241652 },
      { id: 19, date: '02/08/25', description: 'Penjualan galon bekas', income: 10000, expense: null, balance: 1251652 },
      { id: 20, date: '02/08/25', description: 'Alokasi Tabungan Cinta Guru (Bendahara)', income: null, expense: 356268, balance: 895384 },
      { id: 21, date: '02/08/25', description: 'Pembelian BBM', income: null, expense: 50000, balance: 845384 },
      { id: 22, date: '22/08/25', description: 'Penjualan kipas angin bekas', income: 10000, expense: null, balance: 855384 },
      { id: 23, date: '24/08/25', description: 'Pembelian cat (Emco 52)', income: null, expense: 42500, balance: 812884 },
      { id: 24, date: '24/08/25', description: 'Pembelian cat (Emco 66)', income: null, expense: 48100, balance: 764784 },
      { id: 25, date: '24/08/25', description: 'Pembelian kuas 2 buah', income: null, expense: 13000, balance: 751784 },
      { id: 26, date: '24/08/25', description: 'Pembelian thiner 3 buah', income: null, expense: 57000, balance: 694784 },
      { id: 27, date: '24/08/25', description: 'Pembelian pipa wastafel', income: null, expense: 32000, balance: 662784 },
      { id: 28, date: '24/08/25', description: 'Pembelian tempat sabun 8 buah', income: null, expense: 34000, balance: 628784 },
      { id: 29, date: '24/08/25', description: 'Pembelian jemuran portable', income: null, expense: 260000, balance: 368784 },
      { id: 30, date: '26/09/25', description: 'Penjualan alat electronik bekas', income: 15000, expense: null, balance: 383784 },
      { id: 31, date: '26/09/25', description: 'Pembuatan stiker grafrac', income: null, expense: 140000, balance: 243784 },
      { id: 32, date: '23/10/25', description: 'Penjualan rongsok dari muhsinin', income: 160000, expense: null, balance: 403784 },
      { id: 33, date: '24/10/25', description: 'Penjualan galon bekas', income: 15200, expense: null, balance: 418984 },
      { id: 34, date: '24/10/25', description: 'Penjualan ke pengepul', income: 822500, expense: null, balance: 1241484 },
      { id: 35, date: '24/10/25', description: 'Alokasi Tabungan Cinta Guru (Bendahara)', income: null, expense: 498850, balance: 742634 },
      { id: 36, date: '19/11/25', description: 'Penjualan minyak jlantah', income: 275000, expense: null, balance: 1017634 },
      { id: 37, date: '28/11/25', description: 'Penjualan ke pengepul 1', income: 950000, expense: null, balance: 1967634 },
      { id: 38, date: '28/11/25', description: 'Penjualan ke pengepul 2', income: 200000, expense: null, balance: 2167634 },
      { id: 39, date: '28/11/25', description: 'Penjualan botol bekas', income: 10000, expense: null, balance: 2177634 },
      { id: 40, date: '29/11/25', description: 'Kontribusi Program November Ceria', income: null, expense: 1435000, balance: 742634 },
      { id: 41, date: '12/12/25', description: 'Penjualan alat elektronik bekas', income: 55000, expense: null, balance: 797634 },
      { id: 42, date: '12/12/25', description: 'Penjualan mainan bekas', income: 52500, expense: null, balance: 850134 },
      { id: 43, date: '13/12/25', description: 'Penjualan oven bekas', income: 150000, expense: null, balance: 1000134 },
      { id: 44, date: '19/12/25', description: 'Penjualan ke pengepul', income: 260700, expense: null, balance: 1260834 },
      { id: 45, date: '19/12/25', description: 'Alokasi Tabungan Cinta Guru (Bendahara)', income: null, expense: 259100, balance: 1001734 },
      { id: 47, date: '09/01/26', description: 'Penjualan sepeda bekas', income: 100000, expense: null, balance: 1101734 },
      { id: 47, date: '13/01/26', description: 'Penjualan magic com bekas', income: 20000, expense: null, balance: 1121734 },
      { id: 48, date: '15/01/26', description: 'Penjualan ke pengepul (171 kg)', income: 398800, expense: null, balance: 1520534 },
      { id: 49, date: '21/01/26', description: 'Penjualan jlantah 1 ltr', income: 9000, expense: null, balance: 1529534 },
      { id: 50, date: '21/01/26', description: 'Penjualan galon bekas (4 unit)', income: 8000, expense: null, balance: 1537534 },
      { id: 51, date: '21/01/26', description: 'Alokasi Tabungan Cinta Guru (Bendahara)', income: null, expense: 267900, balance: 1269634 },
      { id: 52, date: '13/02/26', description: 'Perolehan Resik', income: 583200, expense: null, balance: 1852834 },
      { id: 53, date: '13/02/26', description: 'Alokasi Tabungan Cinta Guru (50% Perolehan)', income: null, expense: 291600, balance: 1602035 }
    ],
    monthlyFlow: [
      { month: 'P1-P2', income: 1246915, expense: 622500 },
      { month: 'P3', income: 679405, expense: 774703 },
      { month: 'P4', income: 722535, expense: 406268 },
      { month: 'P5', income: 997700, expense: 638850 },
      { month: 'P6', income: 1435000, expense: 1435000 },
      { month: 'P7', income: 518200, expense: 259100 },
      { month: 'P8', income: 535800, expense: 267900 },
      { month: 'P9', income: 583200, expense: 291600 }
    ],
    incomeCategories: [
      { name: 'Pengepul', value: 75, color: '#7C9B93' },
      { name: 'Muhsinin/Umum', value: 20, color: '#C9D6D9' },
      { name: 'Minyak Jlantah', value: 5, color: '#638079' }
    ],
    expenseCategories: [
      { name: 'Cinta Guru', value: 50, color: '#A68B8B' },
      { name: 'MAF Poncokusumo', value: 30, color: '#C9D6D9' },
      { name: 'Ops/Sarpras', value: 20, color: '#7C9B93' }
    ]
  },
  'Siyar': {
    profile: {
      vision: 'Mewujudkan dukungan pembelajaran dan dakwah yang terencana, tepat sasaran, dan berorientasi manfaat jangka panjang.',
      missions: [
        'Menghimpun dana program Siyar secara bertahap dan transparan.',
        'Menyalurkan dana sesuai prioritas kebutuhan program Bilistiwa.',
        'Menjaga pelaporan keuangan agar mudah dipantau oleh jamaah.'
      ],
      agenda: [
        'Koordinasi tim program setiap Senin pekan pertama.',
        'Publikasi progress donasi setiap pertengahan bulan.',
        'Evaluasi penyaluran dan kebutuhan program pada akhir bulan.'
      ],
      contributions: [
        {
          title: 'Pengurangan Limbah',
          value: '18 kg',
          description: 'Limbah kegiatan program berhasil dikurangi dari titik kumpul.',
          illustration: 'reduction'
        },
        {
          title: 'Sampah Tersortir',
          value: '14 kg',
          description: 'Sampah dipisahkan untuk memudahkan distribusi pemanfaatan.',
          illustration: 'sorted'
        },
        {
          title: 'Sampah yang Dimanfaatkan',
          value: '10 kg',
          description: 'Material yang masih bernilai berhasil dimanfaatkan kembali.',
          illustration: 'utilized'
        }
      ],
      team: [
        { name: 'Ummu Sarah', role: 'PIC Program', photo: 'https://i.pravatar.cc/240?img=32' },
        { name: 'Ummu Alya', role: 'Admin Donasi', photo: 'https://i.pravatar.cc/240?img=31' },
        { name: 'Ummu Laila', role: 'Keuangan', photo: 'https://i.pravatar.cc/240?img=33' }
      ]
    },
    summary: { balance: 0, income: 30000000, expense: 30000000 },
    transactions: [
      { id: 1, date: '14/01/24', description: 'Pemasukan Tahap 1', income: 6250000, expense: null, balance: 6250000 },
      { id: 2, date: '11/03/25', description: 'Pemasukan Tahap 2', income: 1250000, expense: null, balance: 7500000 },
      { id: 3, date: '11/03/25', description: 'Bisyaroh Bu Ratna', income: null, expense: 500000, balance: 7000000 },
      { id: 4, date: '08/09/25', description: 'Pemasukan Tahap 3', income: 18000000, expense: null, balance: 25000000 },
      { id: 5, date: '06/10/25', description: 'Pemasukan Tahap 4', income: 1500000, expense: null, balance: 26500000 },
      { id: 6, date: '31/12/25', description: 'Penyaluran ke Blistiwa', income: null, expense: 26500000, balance: 0 },
      { id: 7, date: '20/01/26', description: 'Bisyaroh Siyar', income: 3000000, expense: null, balance: 3000000 },
      { id: 8, date: '21/01/26', description: 'Penyaluran Bisyaroh', income: null, expense: 3000000, balance: 0 }
    ],
    monthlyFlow: [
      { month: 'Jan 24', income: 6250000, expense: 0 },
      { month: 'Mar 25', income: 1250000, expense: 500000 },
      { month: 'Sep 25', income: 18000000, expense: 0 },
      { month: 'Des 25', income: 0, expense: 26500000 },
      { month: 'Jan 26', income: 3000000, expense: 3000000 }
    ],
    incomeCategories: [
      { name: 'Donasi Program', value: 90, color: '#7C9B93' },
      { name: 'Bisyaroh', value: 10, color: '#C9D6D9' }
    ],
    expenseCategories: [
      { name: 'Bilistiwa', value: 98, color: '#638079' },
      { name: 'Operasional', value: 2, color: '#718096' }
    ]
  },
  'Hadeyya': {
    profile: {
      vision: 'Menjadi program hadiah dan dukungan situasional yang responsif untuk kebutuhan pendidikan dan kemaslahatan.',
      missions: [
        'Mengelola dana Hadeyya dengan akuntabilitas yang konsisten.',
        'Memprioritaskan penyaluran pada kebutuhan mendesak dan berdampak.',
        'Memperluas partisipasi donatur melalui kanal donasi yang mudah.'
      ],
      agenda: [
        'Pendataan kebutuhan situasional setiap pekan kedua.',
        'Verifikasi pengajuan bantuan setiap hari Rabu.',
        'Penyaluran prioritas berdasarkan urgensi di pekan keempat.'
      ],
      contributions: [
        {
          title: 'Pengurangan Limbah',
          value: '22 kg',
          description: 'Volume limbah berhasil ditekan melalui pengelolaan terjadwal.',
          illustration: 'reduction'
        },
        {
          title: 'Sampah Tersortir',
          value: '17 kg',
          description: 'Pemilahan sampah dilakukan untuk meningkatkan efektivitas proses.',
          illustration: 'sorted'
        },
        {
          title: 'Sampah yang Dimanfaatkan',
          value: '12 kg',
          description: 'Sampah layak pakai dimanfaatkan untuk kebutuhan produktif.',
          illustration: 'utilized'
        }
      ],
      team: [
        { name: 'Ummu Hana', role: 'Koordinator Hadeyya', photo: 'https://i.pravatar.cc/240?img=12' },
        { name: 'Ummu Zahra', role: 'Humas Donatur', photo: 'https://i.pravatar.cc/240?img=11' },
        { name: 'Ummu Maryam', role: 'Verifikator Penyaluran', photo: 'https://i.pravatar.cc/240?img=14' }
      ]
    },
    summary: { balance: 7070600, income: 8785600, expense: 1715000 },
    transactions: [
      { id: 1, date: '2025', description: 'Pemasukan 2025', income: 7195100, expense: null, balance: 7195100 },
      { id: 2, date: '2025', description: 'Penyaluran Poncokusumo', income: null, expense: 1715000, balance: 5480100 },
      { id: 3, date: '10/01/26', description: 'TF Irma', income: 15000, expense: null, balance: 5495100 },
      { id: 4, date: '18/01/26', description: 'QRIS Mb Ifa', income: 105000, expense: null, balance: 5600100 },
      { id: 5, date: '21/01/26', description: 'TF Anniva', income: 20000, expense: null, balance: 5620100 },
      { id: 6, date: '21/01/26', description: 'TF Anniva', income: 385500, expense: null, balance: 6005600 },
      { id: 7, date: '28/01/26', description: 'QRIS Mb Epi', income: 51000, expense: null, balance: 6056600 },
      { id: 8, date: '28/01/26', description: 'QRIS Mb Dyah', income: 30000, expense: null, balance: 6086600 },
      { id: 9, date: '28/01/26', description: 'QRIS', income: 20000, expense: null, balance: 6106600 },
      { id: 10, date: '29/01/26', description: 'QRIS', income: 10000, expense: null, balance: 6116600 },
      { id: 11, date: '30/01/26', description: 'TF Anniva', income: 45000, expense: null, balance: 6161600 },
      { id: 12, date: '30/01/26', description: 'TF Andi Putra', income: 909000, expense: null, balance: 7070600 }
    ],
    monthlyFlow: [
      { month: '2025', income: 7195100, expense: 1715000 },
      { month: 'Jan 26', income: 1590500, expense: 0 }
    ],
    incomeCategories: [
      { name: 'Wali Murid', value: 75, color: '#7C9B93' },
      { name: 'Umum', value: 25, color: '#638079' }
    ],
    expenseCategories: [
      { name: 'MAF Poncokusumo', value: 95, color: '#A68B8B' },
      { name: 'Ops', value: 5, color: '#718096' }
    ]
  },
  'Haru': {
    profile: {
      vision: 'Menghadirkan kebahagiaan Ramadhan untuk para guru melalui hadiah yang bermakna dan tepat waktu.',
      missions: [
        'Menghimpun dana HARU secara mingguan dengan target yang terukur.',
        'Menjaga semangat kolaborasi wali murid dalam gerakan hadiah guru.',
        'Memastikan realisasi hadiah sesuai amanah dan kebutuhan penerima.'
      ],
      agenda: [
        'Kampanye penggalangan dana setiap Jumat.',
        'Update progress hadiah guru setiap Ahad malam.',
        'Finalisasi paket hadiah pada pekan terakhir sebelum penyaluran.'
      ],
      contributions: [
        {
          title: 'Pengurangan Limbah',
          value: '26 kg',
          description: 'Limbah event berhasil ditekan lewat skema pengelolaan bersama.',
          illustration: 'reduction'
        },
        {
          title: 'Sampah Tersortir',
          value: '20 kg',
          description: 'Sampah terpilah untuk memudahkan distribusi dan penanganan.',
          illustration: 'sorted'
        },
        {
          title: 'Sampah yang Dimanfaatkan',
          value: '15 kg',
          description: 'Material bermanfaat disalurkan kembali untuk penggunaan layak.',
          illustration: 'utilized'
        }
      ],
      team: [
        { name: 'Ummu Rania', role: 'Lead Campaign', photo: 'https://i.pravatar.cc/240?img=22' },
        { name: 'Ummu Fathia', role: 'Konten & Publikasi', photo: 'https://i.pravatar.cc/240?img=24' },
        { name: 'Ummu Salma', role: 'Penyaluran Hadiah', photo: 'https://i.pravatar.cc/240?img=26' }
      ]
    },
    summary: { balance: 12687500, income: 12687500, expense: 0 },
    transactions: [
      { id: 1, date: '12/12/25', description: 'Pemasukan HARU', income: 1107000, expense: null, balance: 1107000 },
      { id: 2, date: '13/12/25', description: 'Pemasukan HARU', income: 901500, expense: null, balance: 2008500 },
      { id: 3, date: '19/12/25', description: 'Pemasukan HARU', income: 1170000, expense: null, balance: 3178500 },
      { id: 4, date: '26/12/25', description: 'Pemasukan HARU', income: 1000000, expense: null, balance: 4178500 },
      { id: 5, date: '02/01/26', description: 'Pemasukan HARU', income: 1030000, expense: null, balance: 5208500 },
      { id: 6, date: '09/01/26', description: 'Pemasukan HARU', income: 1010000, expense: null, balance: 6218500 },
      { id: 7, date: '09/01/26', description: 'Pemasukan HARU', income: 1230000, expense: null, balance: 7448500 },
      { id: 8, date: '16/01/26', description: 'Pemasukan HARU', income: 839000, expense: null, balance: 8287500 },
      { id: 9, date: '23/01/26', description: 'Pemasukan HARU', income: 892000, expense: null, balance: 9179500 },
      { id: 10, date: '30/01/26', description: 'Pemasukan HARU', income: 1003000, expense: null, balance: 10182500 },
      { id: 11, date: '06/02/26', description: 'Pemasukan HARU', income: 1435000, expense: null, balance: 11617500 },
      { id: 12, date: '13/02/26', description: 'Pemasukan HARU', income: 1070000, expense: null, balance: 12687500 }
    ],
    monthlyFlow: [
      { month: 'Des 25', income: 4178500, expense: 0 },
      { month: 'Jan 26', income: 6004000, expense: 0 },
      { month: 'Feb 26', income: 2505000, expense: 0 }
    ],
    incomeCategories: [
      { name: 'Bazar', value: 20, color: '#638079' },
      { name: 'Perolehan', value: 80, color: '#7C9B93' }
    ],
    expenseCategories: [
      { name: 'Target Ramadhan', value: 100, color: '#A68B8B' }
    ]
  }
};
