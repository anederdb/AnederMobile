// DRAFT legal texts. They are templates for ANEDER's legal counsel to review and replace; they are not final legal advice.

export const LEGAL_KEYS = ['kullanim-sartlari', 'aydinlatma', 'acik-riza'] as const;
export type LegalKey = (typeof LEGAL_KEYS)[number];

export const LEGAL_DRAFT_NOTICE = 'Bu metin taslaktır; ANEDER hukuk danışmanı tarafından onaylanana kadar bağlayıcı değildir.';

export const LEGAL_PAGES: Record<LegalKey, { title: string; sections: { heading: string; body: string }[] }> = {
  'kullanim-sartlari': {
    title: 'Kullanım Şartları',
    sections: [
      {
        heading: '1. Taraflar ve kapsam',
        body: 'Bu şartlar, Ankara Emlakçılar Derneği (“ANEDER”) mobil uygulamasını kullanan onaylı üyeler için geçerlidir. Uygulamayı kullanarak bu şartları kabul etmiş sayılırsınız.',
      },
      {
        heading: '2. Üyelik',
        body: 'Uygulamaya kayıt, ANEDER yönetiminin onayına tabidir. Onaylanana kadar uygulamanın üyelere özel bölümleri kullanılamaz. Kayıt sırasında verdiğiniz bilgilerin doğru ve güncel olması gerekir.',
      },
      {
        heading: '3. Kullanım kuralları',
        body: 'Üyeler; talepler, firma bilgileri ve profil alanlarında doğru, yasalara ve genel ahlaka uygun içerik paylaşmakla yükümlüdür. Başkalarının kişisel verilerini izinsiz paylaşmak, yanıltıcı ilan vermek veya uygulamayı kötüye kullanmak yasaktır.',
      },
      {
        heading: '4. Paylaşılan içerikler',
        body: 'Talepler, haberler ve diğer içerikler yalnızca onaylı üyeler tarafından görüntülenir. ANEDER, kurallara aykırı içerikleri önceden bildirmeksizin kaldırma ve ilgili hesabı askıya alma hakkını saklı tutar.',
      },
      {
        heading: '5. Sorumluluk sınırı',
        body: 'Üyeler arasındaki ticari ilişkilerden ve paylaşılan bilgilerin doğruluğundan ilgili üye sorumludur. ANEDER, uygulamanın kesintisiz veya hatasız çalışacağını taahhüt etmez.',
      },
      {
        heading: '6. Hesabın silinmesi',
        body: 'Hesabınızı Profil sayfasından istediğiniz zaman silebilirsiniz. Hesap silindiğinde profiliniz, firmalarınız ve taleplerinizle birlikte kalıcı olarak kaldırılır.',
      },
      {
        heading: '7. Değişiklikler ve iletişim',
        body: 'ANEDER bu şartları güncelleyebilir; güncel metin uygulamada yayımlanır. Sorularınız için info@aneder.org adresine yazabilirsiniz.',
      },
    ],
  },
  aydinlatma: {
    title: 'KVKK Aydınlatma Metni',
    sections: [
      {
        heading: '1. Veri sorumlusu',
        body: 'Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla Ankara Emlakçılar Derneği (“ANEDER”) tarafından işlenmektedir. İletişim: info@aneder.org.',
      },
      {
        heading: '2. İşlenen kişisel veriler',
        body: 'Ad soyad, telefon numarası, e-posta adresi, doğum tarihi, profil fotoğrafı, firma bilgileriniz, uygulamaya eklediğiniz talepler, etkinliklere katılım ve giriş (QR) kayıtları ile cihazınıza gönderilen bildirimler için gerekli cihaz bilgisi (bildirim anahtarı).',
      },
      {
        heading: '3. İşleme amaçları',
        body: 'Üyelik başvurunuzun değerlendirilmesi ve üyelik ilişkisinin yürütülmesi; üyeler arası talep ve iletişim imkânının sağlanması; etkinlik, duyuru ve sektör haberlerinin iletilmesi; etkinlik katılım ve giriş kontrolü; doğum gününüzde size özel bir tebrik mesajı gösterilmesi; uygulamanın güvenliğinin sağlanması.',
      },
      {
        heading: '4. Hukuki sebepler',
        body: 'Verileriniz; üyelik sözleşmesinin kurulması ve ifası, hukuki yükümlülüklerin yerine getirilmesi ve meşru menfaatlerimiz kapsamında işlenir. E-posta ile iletişim ve doğum günü mesajı gibi ek işlemler için ayrıca açık rızanız alınır.',
      },
      {
        heading: '5. Verilerin aktarılması ve saklanması',
        body: 'Verileriniz, uygulamanın altyapısını sağlayan hizmet sağlayıcılarla (barındırma, bildirim ve e-posta gönderim hizmetleri) hizmetin gerektirdiği ölçüde paylaşılır. Telefon, firma ve talep bilgileriniz diğer onaylı üyelerce görülebilir; doğum tarihiniz yalnızca size ve ANEDER yöneticilerine görünür. Verileriniz üyeliğiniz sürdüğü sürece saklanır; hesabınızı sildiğinizde silinir.',
      },
      {
        heading: '6. KVKK madde 11 kapsamındaki haklarınız',
        body: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, düzeltilmesini veya silinmesini isteme, itiraz etme ve zarara uğramanız hâlinde tazminat talep etme haklarına sahipsiniz. Başvurularınızı info@aneder.org adresine iletebilirsiniz.',
      },
    ],
  },
  'acik-riza': {
    title: 'Açık Rıza Metni',
    sections: [
      {
        heading: '1. Konu',
        body: 'Bu metin, ANEDER tarafından size e-posta ile bilgilendirme gönderilmesi ve doğum gününüzde uygulamada tebrik mesajı gösterilmesi için isteğe bağlı olarak verdiğiniz açık rızaya ilişkindir.',
      },
      {
        heading: '2. E-posta ile bilgilendirme',
        body: 'Açık rıza vermeniz hâlinde, kayıtlı e-posta adresinize ANEDER etkinlik, duyuru ve sektör haberi e-postaları gönderilebilir. E-postalar ticari reklam niteliğinde değil, üyelik kapsamında bilgilendirme amaçlıdır.',
      },
      {
        heading: '3. Doğum günü mesajı',
        body: 'Kayıt sırasında veya sonradan paylaştığınız doğum tarihiniz yalnızca doğum gününüzde, sadece size uygulamanın ana ekranında bir tebrik mesajı göstermek için kullanılır; diğer üyelerle paylaşılmaz.',
      },
      {
        heading: '4. Rızanın geri alınması',
        body: 'E-posta rızanızı uygulamada Profil sayfasındaki “E-posta bildirimleri” anahtarından istediğiniz zaman kapatabilirsiniz; ileride e-postalarda yer alacak abonelikten çıkma bağlantısı da kullanılabilecektir. Doğum tarihinizi Profil → Düzenle bölümünden değiştirebilirsiniz. Rızanın geri alınması, geri alma tarihine kadar yapılan işlemlerin hukuka uygunluğunu etkilemez.',
      },
      {
        heading: '5. İletişim',
        body: 'Rıza ile ilgili sorularınız için info@aneder.org adresine yazabilirsiniz.',
      },
    ],
  },
};
