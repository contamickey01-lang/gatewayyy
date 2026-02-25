-- ============================================
-- GouPay - Members Area Schema
-- Modules, Lessons, and Enrollments
-- ============================================

-- Table for modules within a product
CREATE TABLE IF NOT EXISTS product_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for lessons within a module
CREATE TABLE IF NOT EXISTS product_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES product_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT,
  video_source VARCHAR(20) DEFAULT 'youtube', -- youtube, vimeo, external
  "order" INTEGER DEFAULT 0,
  content TEXT, -- rich text content/markdown
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for classroom files/attachments
CREATE TABLE IF NOT EXISTS product_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES product_lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for customer enrollments (access control)
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, suspended, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_product_id ON product_modules(product_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON product_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_files_lesson_id ON product_files(lesson_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_product_id ON enrollments(product_id);
