package com.jyf.sbo.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PlanCodeTest {

    @Test
    void fromPersistenceMapsFree() {
        assertThat(PlanCode.fromPersistence("FREE")).isEqualTo(PlanCode.FREE);
    }

    @Test
    void fromPersistenceMapsPlus() {
        assertThat(PlanCode.fromPersistence("PLUS")).isEqualTo(PlanCode.PLUS);
    }

    @Test
    void fromPersistenceMapsPro() {
        assertThat(PlanCode.fromPersistence("PRO")).isEqualTo(PlanCode.PRO);
    }

    @Test
    void fromPersistenceRejectsNull() {
        assertThatThrownBy(() -> PlanCode.fromPersistence(null))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("null");
    }

    @Test
    void fromPersistenceRejectsBlank() {
        assertThatThrownBy(() -> PlanCode.fromPersistence("   "))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("blank");
    }

    @Test
    void fromPersistenceRejectsUnknownValue() {
        assertThatThrownBy(() -> PlanCode.fromPersistence("ENTERPRISE"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Unknown")
            .hasMessageContaining("ENTERPRISE");
    }
}
