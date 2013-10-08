from testtools import TestCase
from struct import unpack


class AdfTest(TestCase):
    def setUp(self):
        super(AdfTest, self).setUp()

    def tearDown(self):
        super(AdfTest, self).tearDown()

    def test_minimal(self):
        from lacli.adf import load_all

        with open('../docs/minimal.adf') as f:
            archive, certificate, _ = load_all(f)
            self.assertEqual(archive.meta['cipher'], 'aes-256-ctr')
            b = unpack("<LLLLLLLL", certificate.key)
            self.assertEqual(b[0], 1911376514)

    def test_sample(self):
        from lacli.adf import load_all

        with open('../docs/sample.adf') as f:
            archive, _, certificate, _ = load_all(f)
            self.assertEqual(archive.meta['cipher'].mode, 'aes-256-ctr')
            b = unpack("<LLLLLLLL", archive.meta['cipher'].input)
            self.assertEqual(b[0], 1911376514)
            b = unpack("<LLLLLLLL", certificate.keys[1].input)
            self.assertEqual(b[0], 1911376514)