"""Compression service and API tests."""

import pytest
from app.services.compression import (
    CavemanCompressor,
    CompressionResult,
    get_compressor,
    get_recovery_store,
    RecoveryStore,
    CompressionMode,
    CompressionProfile,
)


class TestCavemanCompressor:
    """Test the CavemanCompressor class."""

    def test_compress_basic(self):
        """Test basic compression functionality."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "test-session", "test-request")
        
        assert isinstance(result, CompressionResult)
        assert result.original_text == text
        assert "func" in result.compressed_text
        assert "impl" in result.compressed_text
        assert "algo" in result.compressed_text
        assert result.tokens_before > 0
        assert result.tokens_after > 0
        assert result.tokens_saved >= 0
        assert 0 < result.compression_ratio <= 1.0
        assert result.recovery_ref.startswith("ccr://ccr_obj_")

    def test_compress_passthrough(self):
        """Test passthrough mode returns original text."""
        compressor = get_compressor(CompressionMode.PASSTHROUGH, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "test-session", "test-request")
        
        assert result.compressed_text == text
        assert result.tokens_before == result.tokens_after
        assert result.tokens_saved == 0
        assert result.compression_ratio == 1.0
        assert result.recovery_ref == ""

    def test_compress_ultracave(self):
        """Test ultracave mode (alias for compress)."""
        compressor = get_compressor(CompressionMode.ULTRACAVE, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "test-session", "test-request")
        
        assert result.compressed_text != text
        assert result.tokens_saved > 0

    def test_deterministic_compression(self):
        """Test that compression is deterministic."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm for processing large datasets"
        
        result1 = compressor.compress(text, "session-1", "request-1")
        result2 = compressor.compress(text, "session-2", "request-2")
        
        # Compressed text should be identical (deterministic)
        assert result1.compressed_text == result2.compressed_text
        # But recovery refs should differ (different session/request)
        assert result1.recovery_ref != result2.recovery_ref

    def test_recovery_from_store(self):
        """Test recovery using the recovery store."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "test-session", "test-request")
        
        # Recover using the same compressor
        recovered = compressor.recover(result.compressed_text, result.recovery_ref)
        assert recovered == text

    def test_recovery_fallback_reverse_vocab(self):
        """Test recovery fallback using reverse vocabulary."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "test-session", "test-request")
        
        # Clear the store to test fallback
        store = get_recovery_store()
        store.delete(result.recovery_ref)
        
        # Should still recover via reverse vocabulary (lossy)
        recovered = compressor.recover(result.compressed_text, result.recovery_ref)
        # The fallback recovery will replace caveman words with originals
        assert "function" in recovered or "func" in recovered

    def test_token_estimation(self):
        """Test token estimation is reasonable."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        
        # Short text
        short = "Hello world"
        tokens = compressor._estimate_tokens(short)
        assert tokens >= 1
        
        # Longer text
        long = "This is a much longer piece of text that should have more tokens"
        long_tokens = compressor._estimate_tokens(long)
        assert long_tokens > tokens

    def test_profiles_affect_compression(self):
        """Test that different profiles produce different results."""
        text = "This function implements a complex algorithm with configuration parameters"
        
        compressor_safe = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        compressor_balanced = get_compressor(CompressionMode.COMPRESS, CompressionProfile.BALANCED)
        compressor_aggressive = get_compressor(CompressionMode.COMPRESS, CompressionProfile.AGGRESSIVE)
        
        result_safe = compressor_safe.compress(text, "s1", "r1")
        result_balanced = compressor_balanced.compress(text, "s2", "r2")
        result_aggressive = compressor_aggressive.compress(text, "s3", "r3")
        
        # Aggressive should save more tokens (or equal)
        assert result_aggressive.tokens_saved >= result_balanced.tokens_saved
        assert result_balanced.tokens_saved >= result_safe.tokens_saved


class TestRecoveryStore:
    """Test the RecoveryStore class."""

    def test_put_and_get(self):
        """Test storing and retrieving original text."""
        store = RecoveryStore()
        store.put("test-ref", "original text")
        
        retrieved = store.get("test-ref")
        assert retrieved == "original text"

    def test_get_missing(self):
        """Test retrieving non-existent key returns None."""
        store = RecoveryStore()
        retrieved = store.get("non-existent")
        assert retrieved is None

    def test_delete(self):
        """Test deleting a key."""
        store = RecoveryStore()
        store.put("test-ref", "original text")
        
        deleted = store.delete("test-ref")
        assert deleted is True
        assert store.get("test-ref") is None
        
        # Delete again returns False
        deleted = store.delete("test-ref")
        assert deleted is False

    def test_clear(self):
        """Test clearing all entries."""
        store = RecoveryStore()
        store.put("ref1", "text1")
        store.put("ref2", "text2")
        
        store.clear()
        assert store.get("ref1") is None
        assert store.get("ref2") is None

    def test_thread_safety(self):
        """Test thread-safe operations."""
        import threading
        import time
        
        store = RecoveryStore()
        errors = []
        
        def writer(i):
            try:
                for j in range(100):
                    store.put(f"key-{i}-{j}", f"value-{i}-{j}")
                    time.sleep(0.0001)
            except Exception as e:
                errors.append(e)
        
        def reader(i):
            try:
                for j in range(100):
                    store.get(f"key-{i}-{j}")
                    time.sleep(0.0001)
            except Exception as e:
                errors.append(e)
        
        threads = []
        for i in range(5):
            threads.append(threading.Thread(target=writer, args=(i,)))
            threads.append(threading.Thread(target=reader, args=(i,)))
        
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        assert len(errors) == 0


class TestCompressionProfiles:
    """Test different compression profiles."""

    def test_full_safe_preserves_more(self):
        """Test FULL_SAFE profile preserves more original words."""
        text = "The configuration parameter initializes the implementation"
        
        compressor_safe = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        compressor_aggressive = get_compressor(CompressionMode.COMPRESS, CompressionProfile.AGGRESSIVE)
        
        result_safe = compressor_safe.compress(text, "s1", "r1")
        result_aggressive = compressor_aggressive.compress(text, "s2", "r2")
        
        # Aggressive should compress more (higher ratio = less compression)
        assert result_aggressive.compression_ratio <= result_safe.compression_ratio

    def test_all_profiles_work(self):
        """Test all three profiles work without errors."""
        text = "function implementation configuration parameter"
        
        for profile in [CompressionProfile.FULL_SAFE, CompressionProfile.BALANCED, CompressionProfile.AGGRESSIVE]:
            compressor = get_compressor(CompressionMode.COMPRESS, profile)
            result = compressor.compress(text, "session", "request")
            assert result.compressed_text is not None
            assert result.tokens_before > 0


class TestCompressionMetrics:
    """Test compression metrics tracking."""

    def test_tokens_saved_calculation(self):
        """Test tokens saved is calculated correctly."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "session", "request")
        
        assert result.tokens_saved == result.tokens_before - result.tokens_after
        assert result.tokens_saved >= 0

    def test_compression_ratio_calculation(self):
        """Test compression ratio is calculated correctly."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        text = "This function implements a complex algorithm"
        result = compressor.compress(text, "session", "request")
        
        expected_ratio = result.tokens_after / result.tokens_before
        assert abs(result.compression_ratio - expected_ratio) < 0.001

    def test_compression_reduces_tokens(self):
        """Test that compression typically reduces token count."""
        compressor = get_compressor(CompressionMode.COMPRESS, CompressionProfile.FULL_SAFE)
        # Use text with many compressible terms
        text = "function implementation configuration parameter initialization algorithm complexity optimization performance memory allocation"
        result = compressor.compress(text, "session", "request")
        
        # Should achieve some compression
        assert result.tokens_saved > 0
        assert result.compression_ratio < 1.0
