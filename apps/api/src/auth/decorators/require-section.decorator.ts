import { SetMetadata } from '@nestjs/common';
import { StoreSection } from '@prisma/client';

export const REQUIRE_SECTION_KEY = 'requireSection';

// يقبل أكثر من قسم (يكفي أن يملك الموظف صلاحية واحدة منها) — مفيد لمسار
// يشترك فيه أكثر من تبويب منطقي (مثال: قائمة المنتجات تحتاجها صلاحية
// "المنتجات" أو "المخزون" كلاهما). لا يؤثر إطلاقاً على غير الحسابات
// الفرعية (صاحب المحل نفسه يمر دائماً بدون قيد — راجع SectionGuard)
export const RequireSection = (...sections: StoreSection[]) => SetMetadata(REQUIRE_SECTION_KEY, sections);
