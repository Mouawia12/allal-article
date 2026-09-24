package com.allalarticle.backend.accounting;

import com.allalarticle.backend.accounting.entity.NumberSequence;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NumberSequenceTest {

    private static NumberSequence sequence() {
        var seq = new NumberSequence();
        seq.setPrefix("INV-2026-");
        seq.setNextNumber(1L);
        seq.setPadding((short) 5);
        return seq;
    }

    @Test
    void usesTheStoredPrefixAsIsRatherThanAddingASecondSeparator() {
        assertThat(sequence().generateAndIncrement()).isEqualTo("INV-2026-00001");
    }

    @Test
    void padsAndAdvancesOnEachCall() {
        var seq = sequence();

        assertThat(seq.generateAndIncrement()).isEqualTo("INV-2026-00001");
        assertThat(seq.generateAndIncrement()).isEqualTo("INV-2026-00002");
        assertThat(seq.getNextNumber()).isEqualTo(3L);
    }
}
